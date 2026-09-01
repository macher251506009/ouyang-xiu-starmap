import { useState, type ReactNode } from "react";

/**
 * 可收起的左侧控制面板容器。
 * 初始展开；可点击头部「收起 ▲」折叠成一条细栏，再点「☰ 控制」重新展开。
 * 折叠后完全不遮挡星图。
 */
export default function ControlDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="ctrl-drawer">
      {open ? (
        <>
          <button
            className="drawer-collapse"
            onClick={() => setOpen(false)}
            aria-label="收起控制面板"
            title="收起控制面板"
          >
            ▲ 收起
          </button>
          <div className="controls">{children}</div>
        </>
      ) : (
        <button
          className="drawer-open"
          onClick={() => setOpen(true)}
          aria-label="展开控制面板"
          title="展开控制面板（选择人物、筛选关系）"
        >
          ☰ 控制
        </button>
      )}
    </div>
  );
}
