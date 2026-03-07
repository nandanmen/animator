import { html } from "@codemirror/lang-html";
import { codeFolding, foldGutter } from "@codemirror/language";
import CodeMirror from "@uiw/react-codemirror";
import * as beautify from "js-beautify";
import { useCallback, useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

const TAILWIND_CDN = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4";

const PICKER_SCRIPT = `
(function() {
  var lastHovered = null;
  var hoverClass = 'animator-hover-ring';

  document.addEventListener('mousemove', function(e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (el !== lastHovered) {
      if (lastHovered) lastHovered.classList.remove(hoverClass);
      lastHovered = el && el !== document.body ? el : null;
      if (lastHovered) lastHovered.classList.add(hoverClass);
    }
  }, true);

  document.addEventListener('mouseleave', function() {
    if (lastHovered) {
      lastHovered.classList.remove(hoverClass);
      lastHovered = null;
    }
  }, true);

  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var el = e.target;
    if (!el || !el.attributes || el === document.body) return;
    var attrs = {};
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      attrs[a.name] = a.value;
    }
    window.parent.postMessage({
      type: 'animator-select',
      tagName: el.tagName.toLowerCase(),
      attributes: attrs
    }, '*');
  }, true);
})();
`;

const PICKER_HOVER_STYLES = `
.animator-hover-ring {
  outline: 2px solid var(--blue-9, #3b82f6);
  outline-offset: 2px;
}
`;

const CODE_STORAGE_KEY = "animator-code";

function buildPreviewDocument(bodyHtml: string): string {
	const scriptBody = PICKER_SCRIPT.replace(/<\/script>/gi, "</scr" + "ipt>");
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><script src="${TAILWIND_CDN}"></script><style>${PICKER_HOVER_STYLES}</style></head><body class="h-screen flex items-center justify-center">${bodyHtml}<script>${scriptBody}</script></body></html>`;
}

const FOLD_CARET_SVG =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M8 10L10.9393 12.9393C11.5251 13.5251 12.4749 13.5251 13.0607 12.9393L16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function createFoldMarker(open: boolean): HTMLElement {
	const span = document.createElement("span");
	span.className = "cm-foldMarker";
	span.innerHTML = FOLD_CARET_SVG;
	span.style.display = "inline-flex";
	span.style.alignItems = "center";
	span.style.justifyContent = "center";
	if (!open) {
		span.style.transform = "rotate(-90deg)";
	}
	return span;
}

export type NodeProperties = {
	tagName: string;
	attributes: Record<string, string>;
};

export default function Index() {
	const [pastedSnippet, setPastedSnippet] = useState("");
	const [selectedNode, setSelectedNode] = useState<NodeProperties | null>(null);

	useEffect(() => {
		try {
			const stored = localStorage.getItem(CODE_STORAGE_KEY);
			if (stored) setPastedSnippet(stored);
		} catch {
			// ignore localStorage errors (private mode, etc.)
		}
	}, []);

	useEffect(() => {
		try {
			if (pastedSnippet) {
				localStorage.setItem(CODE_STORAGE_KEY, pastedSnippet);
			} else {
				localStorage.removeItem(CODE_STORAGE_KEY);
			}
		} catch {
			// ignore localStorage errors
		}
	}, [pastedSnippet]);

	useEffect(() => {
		const onMessage = (e: MessageEvent) => {
			if (e.data?.type === "animator-select" && e.data?.tagName) {
				setSelectedNode({
					tagName: e.data.tagName,
					attributes: e.data.attributes ?? {},
				});
			}
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, []);

	const handlePaste = useCallback((e: React.ClipboardEvent) => {
		e.preventDefault();
		const htmlData = e.clipboardData.getData("text/html");
		const text = e.clipboardData.getData("text/plain");
		const raw = htmlData.trim() || text.trim();
		if (raw) {
			const formatted = beautify.html(raw, {
				indent_size: 2,
				wrap_line_length: 80,
				preserve_newlines: false,
			});
			setPastedSnippet(formatted);
			setSelectedNode(null);
		}
	}, []);

	return (
		<Group orientation="horizontal" className="min-h-screen ">
			<Panel
				id="code"
				defaultSize={320}
				minSize={240}
				maxSize={480}
				className="flex flex-col py-4 overflow-visible!"
			>
				<div className="flex flex-col grow overflow-hidden min-h-0">
					{pastedSnippet ? (
						<CodeMirror
							value={pastedSnippet}
							onChange={setPastedSnippet}
							extensions={[
								html(),
								// EditorView.lineWrapping,
								codeFolding(),
								foldGutter({ markerDOM: createFoldMarker }),
							]}
							basicSetup={{ foldGutter: false }}
							className="h-fit text-[13px] py-4 [&_.cm-editor]:h-full [&_.cm-editor]:bg-transparent! [&_.cm-scroller]:min-h-[200px] [&_.cm-lineNumbers]:hidden! [&_.cm-content]:bg-transparent [&_.cm-gutters]:bg-gray-3! [&_.cm-gutters]:border-none! [&_.cm-scroller]:font-mono! [&_.cm-scroller]:leading-normal! [&_.cm-focused]:outline-none! [&_.cm-gutterElement]:w-10 [&_.cm-gutterElement]:flex [&_.cm-gutterElement]:justify-center [&_.cm-gutterElement_span]:w-[19.5px]  [&_.cm-gutterElement_span]:flex! [&_.cm-gutterElement_span]:items-center! [&_.cm-gutterElement_span]:justify-center! [&_.cm-gutterElement_span]:h-[19.5px] [&_.cm-gutterElement_span]:hover:bg-gray-4 [&_.cm-gutterElement_span]:rounded"
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
			</Panel>

			<Separator className="w-2 mx-1 shrink-0 bg-transparent transition-colors hover:bg-gray-6 data-[data-separator=active]:bg-blue-6" />

			<Panel id="preview" minSize={240} className="flex flex-col py-4 overflow-visible!">
				<section
					className="flex flex-col grow bg-gray-1 rounded-xl shadow-sm overflow-hidden min-h-0 outline-none focus:ring-2 focus:ring-blue-6 focus:ring-offset-2"
					onPaste={handlePaste}
					// biome-ignore lint/a11y/noNoninteractiveTabindex: paste target must be focusable for Cmd+V
					tabIndex={0}
					aria-label="Preview: paste HTML here"
				>
					{pastedSnippet ? (
						<iframe
							srcDoc={buildPreviewDocument(pastedSnippet)}
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
				<div className="flex flex-col grow overflow-hidden min-h-0 justify-center">
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
											<div
												key={name}
												className="font-mono text-gray-12 text-xs bg-gray-2 rounded px-2 py-1.5 break-all"
											>
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
						<p className="text-gray-9 text-sm">
							No node selected. Click an element in the preview.
						</p>
					)}
				</div>
			</Panel>
		</Group>
	);
}
