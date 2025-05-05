import SidebarContent from './SidebarContent'

function DesktopSidebar() {
  return (
    <aside
      id="desktopSidebar"
      className="fixed left-0 z-30 flex-shrink-0 hidden w-64 bg-white dark:bg-gray-800 lg:block"
    >
        <SidebarContent />
    </aside>
  )
}

export default DesktopSidebar
