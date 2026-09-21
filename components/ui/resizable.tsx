"use client";

import { useAuth } from "@clerk/nextjs";
import { GripVertical } from "lucide-react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
  type LayoutStorage,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ssrStorage: LayoutStorage = {
  getItem: () => null,
  setItem: () => {},
};

type ResizableGroupProps = React.ComponentProps<typeof Group> & {
  panelIds?: string[];
};

function ResizableGroup({
  className,
  defaultLayout: defaultLayoutProp,
  id,
  onLayoutChanged: onLayoutChangedProp,
  orientation = "horizontal",
  panelIds,
  ...props
}: ResizableGroupProps) {
  const { userId } = useAuth();
  const layoutId = `${userId ?? "anonymous"}:${String(id ?? "resizable")}`;
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: layoutId,
    onlySaveAfterUserInteractions: true,
    panelIds,
    storage: typeof window === "undefined" ? ssrStorage : localStorage,
  });

  return (
    <Group
      {...props}
      defaultLayout={defaultLayoutProp ?? defaultLayout}
      id={id}
      onLayoutChanged={(layout, meta) => {
        onLayoutChanged(layout, meta);
        onLayoutChangedProp?.(layout, meta);
      }}
      orientation={orientation}
      className={cn("flex h-full w-full", className)}
    />
  );
}

function ResizablePanel({
  className,
  ...props
}: React.ComponentProps<typeof Panel>) {
  return (
    <Panel className={cn("min-h-0 min-w-0 overflow-hidden", className)} {...props} />
  );
}

function ResizableHandle({
  className,
  withHandle = true,
  ...props
}: React.ComponentProps<typeof Separator> & { withHandle?: boolean }) {
  return (
    <Separator
      aria-label="Resize panels"
      className={cn(
        "relative flex w-2 shrink-0 items-center justify-center bg-yellow-500/20 transition-colors hover:bg-yellow-400/50",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-8 w-3 items-center justify-center rounded-sm border border-yellow-500/40 bg-neutral-900">
          <GripVertical className="size-3 text-yellow-400" />
        </div>
      )}
    </Separator>
  );
}

export { ResizableGroup, ResizablePanel, ResizableHandle };
