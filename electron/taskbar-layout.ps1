# Returns the primary Windows taskbar geometry and the classic task-list / tray
# descendants.  Electron itself only exposes the work area, not the taskbar's
# child regions, so this small read-only probe lets the widget avoid the tray.
Add-Type @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public static class TaskbarLayoutProbe {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string className, string windowName);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr hWnd, StringBuilder className, int maxCount);
  [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr hWndParent, EnumWindowsProc callback, IntPtr lParam);

  public class WindowInfo { public string Class; public int Left; public int Top; public int Right; public int Bottom; }
  public static WindowInfo GetInfo(IntPtr hWnd) {
    if (hWnd == IntPtr.Zero) return null;
    RECT rect; if (!GetWindowRect(hWnd, out rect)) return null;
    var name = new StringBuilder(256); GetClassName(hWnd, name, name.Capacity);
    return new WindowInfo { Class=name.ToString(), Left=rect.Left, Top=rect.Top, Right=rect.Right, Bottom=rect.Bottom };
  }
  public static List<WindowInfo> GetDescendants(IntPtr parent) {
    var result = new List<WindowInfo>();
    EnumChildWindows(parent, delegate(IntPtr hwnd, IntPtr ignored) { var item=GetInfo(hwnd); if(item!=null) result.Add(item); return true; }, IntPtr.Zero);
    return result;
  }
}
'@

$taskbarHandle = [TaskbarLayoutProbe]::FindWindow('Shell_TrayWnd', $null)
$taskbar = [TaskbarLayoutProbe]::GetInfo($taskbarHandle)
if ($null -eq $taskbar) { exit 1 }
$nodes = [TaskbarLayoutProbe]::GetDescendants($taskbarHandle)
$tray = $nodes | Where-Object { $_.Class -eq 'TrayNotifyWnd' } | Select-Object -First 1
$taskList = $nodes | Where-Object { $_.Class -eq 'MSTaskListWClass' } | Select-Object -First 1
$taskSwitch = $nodes | Where-Object { $_.Class -eq 'MSTaskSwWClass' } | Select-Object -First 1
$taskButtons = @()

# Windows 11 hosts many task buttons inside a XAML island, outside the legacy
# MSTaskListWClass bounds. UI Automation sees their real rectangles, so use it
# to reserve every visible task button before placing the companion.
try {
  Add-Type -AssemblyName UIAutomationClient
  $automationRoot = [System.Windows.Automation.AutomationElement]::FromHandle($taskbarHandle)
  $buttonCondition = [System.Windows.Automation.AndCondition]::new(
    [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::IsControlElementProperty, $true),
    [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)
  )
  $buttons = $automationRoot.FindAll([System.Windows.Automation.TreeScope]::Descendants, $buttonCondition)
  $trayLeft = if ($null -ne $tray) { $tray.Left } else { $taskbar.Right - 260 }
  foreach ($button in $buttons) {
    $rect = $button.Current.BoundingRectangle
    # 仅收集任务栏常规按键区域的按钮，排除托盘内部、托盘右侧（如显示桌面）以及微型按键
    if ($rect.Width -gt 8 -and $rect.Height -gt 8 -and $rect.Bottom -gt $taskbar.Top -and $rect.Top -lt $taskbar.Bottom) {
      if ($rect.Left -lt ($trayLeft - 4) -and $rect.Right -le ($trayLeft + 12)) {
        $taskButtons += [PSCustomObject]@{
          Name = $button.Current.Name
          ProcessId = $button.Current.ProcessId
          Left = [math]::Round($rect.Left)
          Top = [math]::Round($rect.Top)
          Right = [math]::Round($rect.Right)
          Bottom = [math]::Round($rect.Bottom)
        }
      }
    }
  }
} catch { }

[PSCustomObject]@{
  taskbar = $taskbar
  tray = $tray
  taskList = $taskList
  taskSwitch = $taskSwitch
  taskButtons = $taskButtons
} | ConvertTo-Json -Compress
