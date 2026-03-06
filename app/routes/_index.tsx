import { useCallback, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

const TAILWIND_CDN = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";

function buildPreviewDocument(bodyHtml: string): string {
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><script src="${TAILWIND_CDN}"></script></head><body class="h-screen flex items-center justify-center">${bodyHtml}</body></html>`;
}

export default function Index() {
	const [pastedHtml, setPastedHtml] = useState("");

	const handlePaste = useCallback((e: React.ClipboardEvent) => {
		e.preventDefault();
		const html = e.clipboardData.getData("text/html");
		const text = e.clipboardData.getData("text/plain");
		const value = html.trim() || text.trim();
		if (value) setPastedHtml(buildPreviewDocument(value));
	}, []);

	return (
		<Group orientation="horizontal" className="min-h-screen ">
			<Panel
				id="code"
				defaultSize={320}
				minSize={240}
				maxSize={480}
				className="flex flex-col p-4 pr-0 overflow-visible!"
			>
				<div className="flex items-center justify-center grow">
					<p>Code</p>
				</div>
			</Panel>

			<Separator className="w-2 mx-1 shrink-0 bg-transparent transition-colors hover:bg-gray-6 data-[data-separator=active]:bg-blue-6" />

			<Panel id="preview" minSize={240} className="flex flex-col py-4 overflow-visible!">
				{/* tabIndex needed so the panel is focusable and paste (Cmd+V) works */}
				<section
					className="flex flex-col grow bg-gray-1 rounded-xl shadow-sm overflow-hidden min-h-0 outline-none focus:ring-2 focus:ring-blue-6 focus:ring-offset-2"
					onPaste={handlePaste}
					// biome-ignore lint/a11y/noNoninteractiveTabindex: paste target must be focusable for Cmd+V
					tabIndex={0}
					aria-label="Preview: paste HTML here"
				>
					{pastedHtml ? (
						<iframe
							srcDoc={pastedHtml}
							title="HTML preview with Tailwind"
							className="w-full h-full min-h-[320px] border-0 rounded-xl bg-white"
							sandbox="allow-same-origin allow-scripts"
						/>
					) : (
						<div className="flex flex-col items-center justify-center grow text-gray-11 gap-2 p-6 text-center">
							<p className="font-medium">Paste HTML here</p>
							<p className="text-sm text-gray-10">
								Use Cmd+V (Mac) or Ctrl+V (Windows) to paste. Tailwind classes will be styled via
								Play CDN.
							</p>
						</div>
					)}
				</section>
			</Panel>

			<Separator className="w-2 mx-1 shrink-0 bg-transparent transition-colors hover:bg-gray-6 data-[data-separator=active]:bg-blue-6" />

			<Panel
				id="attributes"
				defaultSize={320}
				minSize={240}
				maxSize={480}
				className="flex flex-col p-4 pl-0 overflow-visible!"
			>
				<div className="flex items-center justify-center grow">
					<p>Attributes</p>
				</div>
			</Panel>
		</Group>
	);
}
