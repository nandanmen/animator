import { Group, Panel, Separator } from "react-resizable-panels";

export default function Index() {
	return (
		<Group orientation="horizontal" className="min-h-screen">
			<Panel
				id="code"
				defaultSize={240}
				minSize={240}
				maxSize={320}
				className="flex flex-col border-r border-gray-6 bg-gray-2"
			>
				<header className="shrink-0 border-b border-gray-6 bg-gray-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-11">
					Code
				</header>
				<div className="min-h-0 flex-1 p-4">{/* Code editor placeholder – no logic yet */}</div>
			</Panel>

			<Separator className="w-2 shrink-0 bg-gray-5 transition-colors hover:bg-gray-6 data-[data-separator=active]:bg-blue-6" />

			<Panel
				id="preview"
				defaultSize={50}
				minSize={25}
				className="flex flex-col border-r border-gray-6 bg-gray-1"
			>
				<header className="shrink-0 border-b border-gray-6 bg-gray-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-11">
					Preview
				</header>
				<div className="min-h-0 flex-1 p-4">
					{/* Preview iframe/content placeholder – no logic yet */}
				</div>
			</Panel>

			<Separator className="w-2 shrink-0 bg-gray-5 transition-colors hover:bg-gray-6 data-[data-separator=active]:bg-blue-6" />

			<Panel
				id="attributes"
				defaultSize={240}
				minSize={240}
				maxSize={320}
				className="flex flex-col bg-gray-2"
			>
				<header className="shrink-0 border-b border-gray-6 bg-gray-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-11">
					Attributes
				</header>
				<div className="min-h-0 flex-1 p-4">
					{/* Figma-like attributes panel placeholder – no logic yet */}
				</div>
			</Panel>
		</Group>
	);
}
