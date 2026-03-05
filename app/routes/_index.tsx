export default function Index() {
	return (
		<div className="grid min-h-screen grid-cols-[minmax(240px,320px)_1fr_minmax(240px,280px)]">
			<aside
				className="flex flex-col border-r border-gray-6 bg-gray-2"
				aria-label="Code"
			>
				<header className="shrink-0 border-b border-gray-6 bg-gray-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-11">
					Code
				</header>
				<div className="min-h-0 flex-1 p-4">
					{/* Code editor placeholder – no logic yet */}
				</div>
			</aside>

			<main
				className="flex flex-col border-r border-gray-6 bg-gray-1"
				aria-label="Preview"
			>
				<header className="shrink-0 border-b border-gray-6 bg-gray-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-11">
					Preview
				</header>
				<div className="min-h-0 flex-1 p-4">
					{/* Preview iframe/content placeholder – no logic yet */}
				</div>
			</main>

			<aside
				className="flex flex-col bg-gray-2"
				aria-label="Attributes"
			>
				<header className="shrink-0 border-b border-gray-6 bg-gray-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-11">
					Attributes
				</header>
				<div className="min-h-0 flex-1 p-4">
					{/* Figma-like attributes panel placeholder – no logic yet */}
				</div>
			</aside>
		</div>
	);
}
