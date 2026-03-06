import { html } from "@codemirror/lang-html";
import CodeMirror from "@uiw/react-codemirror";
import { useCallback, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

export type NodeProperties = {
	tagName: string;
	attributes: Record<string, string>;
};

function getAttributes(el: Element): Record<string, string> {
	const attrs: Record<string, string> = {};
	for (let i = 0; i < el.attributes.length; i++) {
		const a = el.attributes[i];
		attrs[a.name] = a.value;
	}
	return attrs;
}

export default function Index() {
	const [pastedSnippet, setPastedSnippet] = useState("");
	const [selectedNode, setSelectedNode] = useState<NodeProperties | null>(null);
	const lastHoveredRef = useRef<Element | null>(null);
	const previewContentRef = useRef<HTMLDivElement | null>(null);
	const hoverClass = "animator-hover-ring";

	const handlePaste = useCallback((e: React.ClipboardEvent) => {
		e.preventDefault();
		const htmlData = e.clipboardData.getData("text/html");
		const text = e.clipboardData.getData("text/plain");
		const value = htmlData.trim() || text.trim();
		if (value) {
			setPastedSnippet(value);
			setSelectedNode(null);
		}
	}, []);

	const handlePreviewMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const el = document.elementFromPoint(e.clientX, e.clientY);
			const content = previewContentRef.current;
			let target: Element | null = el && el !== document.body ? el : null;
			if (target && content && !content.contains(target)) target = null;
			if (target === lastHoveredRef.current) return;
			if (lastHoveredRef.current) {
				lastHoveredRef.current.classList.remove(hoverClass);
			}
			lastHoveredRef.current = target;
			if (target) target.classList.add(hoverClass);
		},
		[],
	);

	const handlePreviewMouseLeave = useCallback(() => {
		if (lastHoveredRef.current) {
			lastHoveredRef.current.classList.remove(hoverClass);
			lastHoveredRef.current = null;
		}
	}, []);

	const handlePreviewClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const el = e.target as Element;
		const content = previewContentRef.current;
		if (
			!el?.attributes ||
			el === document.body ||
			!content?.contains(el) ||
			el === content
		)
			return;
		setSelectedNode({
			tagName: el.tagName.toLowerCase(),
			attributes: getAttributes(el),
		});
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
				<div className="flex flex-col grow bg-gray-1 rounded-xl shadow-sm overflow-hidden min-h-0">
					<div className="px-3 py-2 border-b border-gray-6 shrink-0">
						<h2 className="text-sm font-medium text-gray-12">Code</h2>
						<p className="text-xs text-gray-10 mt-0.5">
							Edit HTML; preview updates as you type.
						</p>
					</div>
					<div className="flex-1 min-h-0 flex flex-col">
						{pastedSnippet ? (
							<CodeMirror
								value={pastedSnippet}
								onChange={setPastedSnippet}
								extensions={[html()]}
								basicSetup={{ lineNumbers: true }}
								className="h-full text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:min-h-[200px]"
							/>
						) : (
							<div className="flex flex-col items-center justify-center grow text-gray-11 gap-2 p-6 text-center">
								<p className="font-medium">Paste HTML in the preview to see the code here</p>
								<p className="text-sm text-gray-10">
									Use Cmd+V (Mac) or Ctrl+V (Windows) in the preview panel.
								</p>
							</div>
						)}
					</div>
				</div>
			</Panel>

			<Separator className="w-2 mx-1 shrink-0 bg-transparent transition-colors hover:bg-gray-6 data-[data-separator=active]:bg-blue-6" />

			<Panel id="preview" minSize={240} className="flex flex-col py-4 overflow-visible!">
				<section
					className="flex flex-col grow bg-gray-1 rounded-xl shadow-sm overflow-hidden min-h-0 outline-none focus:ring-2 focus:ring-blue-6 focus:ring-offset-2"
					onPaste={handlePaste}
					onMouseMove={handlePreviewMouseMove}
					onMouseLeave={handlePreviewMouseLeave}
					onClick={handlePreviewClick}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") e.preventDefault();
					}}
					// biome-ignore lint/a11y/noNoninteractiveTabindex: paste target must be focusable for Cmd+V
					tabIndex={0}
					aria-label="Preview: paste HTML here"
				>
					{pastedSnippet ? (
						<div className="w-full h-full min-h-[320px] overflow-auto flex items-center justify-center p-6 bg-white rounded-xl">
							{/* Pasted HTML is rendered in-document; Tailwind from the app applies */}
							<div
								ref={previewContentRef}
								className="contents"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: preview renders user-pasted HTML in dev tool
								dangerouslySetInnerHTML={{ __html: pastedSnippet }}
							/>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center grow text-gray-11 gap-2 p-6 text-center">
							<p className="font-medium">Paste HTML here</p>
							<p className="text-sm text-gray-10">
								Use Cmd+V (Mac) or Ctrl+V (Windows) to paste. Tailwind classes will be styled by
								the app.
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
				<div className="flex flex-col grow bg-gray-1 rounded-xl shadow-sm overflow-hidden min-h-0">
					<div className="px-3 py-2 border-b border-gray-6">
						<h2 className="text-sm font-medium text-gray-12">Attributes</h2>
						<p className="text-xs text-gray-10 mt-0.5">Click a node in the preview to inspect it.</p>
					</div>
					<div className="flex-1 overflow-auto p-3">
						{selectedNode ? (
							<dl className="space-y-3 text-sm">
								<div>
									<dt className="text-gray-10 font-medium mb-0.5">Tag</dt>
									<dd className="text-gray-12 font-mono">&lt;{selectedNode.tagName}&gt;</dd>
								</div>
								{Object.keys(selectedNode.attributes).length > 0 ? (
									<div>
										<dt className="text-gray-10 font-medium mb-1">Attributes</dt>
										<dd className="space-y-1.5">
											{Object.entries(selectedNode.attributes).map(([name, value]) => (
												<div key={name} className="font-mono text-gray-12 text-xs bg-gray-2 rounded px-2 py-1.5 break-all">
													<span className="text-blue-11">{name}</span>
													{value ? (
														<>
															<span className="text-gray-10">=</span>
															<span className="text-green-11">&quot;{value}&quot;</span>
														</>
													) : null}
												</div>
											))}
										</dd>
									</div>
								) : (
									<div>
										<dt className="text-gray-10 font-medium mb-0.5">Attributes</dt>
										<dd className="text-gray-9 text-xs">None</dd>
									</div>
								)}
							</dl>
						) : (
							<p className="text-gray-9 text-sm">No node selected. Click an element in the preview.</p>
						)}
					</div>
				</div>
			</Panel>
		</Group>
	);
}
