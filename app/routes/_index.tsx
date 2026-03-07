import { html } from "@codemirror/lang-html";
import { codeFolding, foldGutter } from "@codemirror/language";
import CodeMirror from "@uiw/react-codemirror";
import * as beautify from "js-beautify";
import { Fragment, useCallback, useEffect, useState } from "react";
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
const KEYFRAMES_STORAGE_KEY = "animator-keyframes";

export type Keyframe = {
	id: string;
	name: string;
	html: string;
};

function nextKeyframeName(keyframes: Keyframe[]): string {
	const n = keyframes.length + 1;
	return `Keyframe ${n}`;
}

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

function loadKeyframesState(): { keyframes: Keyframe[]; activeKeyframeId: string } {
	try {
		const stored = localStorage.getItem(KEYFRAMES_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as {
				keyframes: Keyframe[];
				activeKeyframeId: string;
			};
			if (
				Array.isArray(parsed.keyframes) &&
				parsed.keyframes.length > 0 &&
				typeof parsed.activeKeyframeId === "string"
			) {
				return {
					keyframes: parsed.keyframes,
					activeKeyframeId: parsed.activeKeyframeId,
				};
			}
		}
		// Migrate from legacy single-snippet storage
		const legacy = localStorage.getItem(CODE_STORAGE_KEY);
		const html = typeof legacy === "string" ? legacy : "";
		const keyframes: Keyframe[] = [{ id: crypto.randomUUID(), name: "Keyframe 1", html }];
		return { keyframes, activeKeyframeId: keyframes[0].id };
	} catch {
		const keyframes: Keyframe[] = [{ id: crypto.randomUUID(), name: "Keyframe 1", html: "" }];
		return { keyframes, activeKeyframeId: keyframes[0].id };
	}
}

function getInitialKeyframesState(): { keyframes: Keyframe[]; activeKeyframeId: string } {
	return loadKeyframesState();
}

export default function Index() {
	const [keyframesState, setKeyframesState] = useState(getInitialKeyframesState);
	const keyframes = keyframesState.keyframes;
	const activeKeyframeId = keyframesState.activeKeyframeId;
	const setActiveKeyframeId = (id: string) => {
		setKeyframesState((prev) => ({ ...prev, activeKeyframeId: id }));
	};
	const [selectedNode, setSelectedNode] = useState<NodeProperties | null>(null);
	const [attributesPanelOpen, setAttributesPanelOpen] = useState(true);

	const activeKeyframe = keyframes.find((k) => k.id === activeKeyframeId) ?? keyframes[0];
	const setActiveKeyframeHtml = useCallback(
		(html: string) => {
			if (!activeKeyframe) return;
			const targetId = activeKeyframe.id;
			setKeyframesState((prev) => ({
				...prev,
				keyframes: prev.keyframes.map((k) => (k.id === targetId ? { ...k, html } : k)),
			}));
		},
		[activeKeyframe]
	);

	const addKeyframe = useCallback(() => {
		setKeyframesState((prev) => {
			const active = prev.keyframes.find((k) => k.id === prev.activeKeyframeId);
			const htmlToCopy = active?.html ?? "";
			const nextFrame: Keyframe = {
				id: crypto.randomUUID(),
				name: nextKeyframeName(prev.keyframes),
				html: htmlToCopy,
			};
			return {
				...prev,
				keyframes: [...prev.keyframes, nextFrame],
				activeKeyframeId: nextFrame.id,
			};
		});
	}, []);

	const removeKeyframe = useCallback((id: string) => {
		setKeyframesState((prev) => {
			const keyframes = prev.keyframes;
			const idx = keyframes.findIndex((k) => k.id === id);
			if (idx < 0 || keyframes.length <= 1) return prev;
			const nextKeyframes = keyframes.filter((k) => k.id !== id);
			const nextActive = keyframes[idx + 1] ?? keyframes[idx - 1];
			return {
				...prev,
				keyframes: nextKeyframes,
				activeKeyframeId: nextActive?.id ?? prev.activeKeyframeId,
			};
		});
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(KEYFRAMES_STORAGE_KEY, JSON.stringify({ keyframes, activeKeyframeId }));
		} catch {
			// ignore localStorage errors
		}
	}, [keyframes, activeKeyframeId]);

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

	const handlePaste = useCallback(
		(e: React.ClipboardEvent) => {
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
				setActiveKeyframeHtml(formatted);
				setSelectedNode(null);
			}
		},
		[setActiveKeyframeHtml]
	);

	return (
		<div className="flex flex-col min-h-screen">
			<div className="grid grid-cols-[1fr_auto] grow pr-2">
				<Group orientation="horizontal" className="grow py-4 pr-2">
					<Panel
						id="code"
						defaultSize={320}
						minSize={240}
						maxSize={480}
						className="flex flex-col overflow-visible!"
					>
						<div className="flex flex-col grow overflow-hidden min-h-0">
							{activeKeyframe ? (
								<CodeMirror
									value={activeKeyframe.html}
									onChange={setActiveKeyframeHtml}
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

					<Separator className="w-2 mx-1 rounded shrink-0 bg-transparent transition-colors hover:bg-gray-6 data-[data-separator=active]:bg-blue-6" />

					<Panel id="preview" minSize={240} className="flex flex-col overflow-visible!">
						<section
							className="flex flex-col grow bg-gray-1 rounded-xl shadow-sm min-h-0 outline-none focus:ring-2 focus:ring-blue-6 focus:ring-offset-2"
							onPaste={handlePaste}
							// biome-ignore lint/a11y/noNoninteractiveTabindex: paste target must be focusable for Cmd+V
							tabIndex={0}
							aria-label="Preview: paste HTML here"
						>
							{activeKeyframe ? (
								<iframe
									srcDoc={buildPreviewDocument(activeKeyframe.html)}
									title="HTML preview with Tailwind"
									className="w-full h-full min-h-[320px] border-0 rounded-xl bg-white"
									sandbox="allow-same-origin allow-scripts"
								/>
							) : null}
						</section>
					</Panel>
				</Group>

				{/* Attributes panel: fixed 300px, toggleable */}
				{attributesPanelOpen ? (
					<aside
						className="w-[300px] shrink-0 flex flex-col overflow-hidden my-4"
						aria-label="Element attributes"
					>
						<div className="flex items-center justify-between border-b border-gray-6 shrink-0">
							<span className="text-xs font-medium text-gray-11 uppercase tracking-wider">
								Attributes
							</span>
							<button
								type="button"
								onClick={() => setAttributesPanelOpen(false)}
								className="p-1.5 rounded-md text-gray-10 hover:text-gray-12 hover:bg-gray-3"
								aria-label="Close attributes panel"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M18 6 6 18" />
									<path d="m6 6 12 12" />
								</svg>
							</button>
						</div>
						<div className="flex flex-col grow overflow-auto min-h-0 p-4 justify-center">
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
					</aside>
				) : (
					<button
						type="button"
						onClick={() => setAttributesPanelOpen(true)}
						className="shrink-0 px-2 my-4 flex flex-col items-center justify-center gap-1 hover:bg-gray-4 text-gray-10 hover:text-gray-12 py-4 rounded-xl"
						aria-label="Open attributes panel"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							width="20"
							aria-hidden="true"
						>
							<path
								d="M3.0025 5.99945C3.0025 4.34398 4.34453 3.00195 6 3.00195H8C9.65548 3.00195 10.9975 4.34398 10.9975 5.99945V7.99945C10.9975 9.65493 9.65548 10.997 8 10.997H6C4.34453 10.997 3.0025 9.65493 3.0025 7.99945V5.99945Z"
								fill="currentColor"
							/>
							<path
								d="M3.0025 15.9995C3.0025 14.344 4.34453 13.002 6 13.002H8C9.65548 13.002 10.9975 14.344 10.9975 15.9995V17.9995C10.9975 19.6549 9.65548 20.997 8 20.997H6C4.34453 20.997 3.0025 19.6549 3.0025 17.9995V15.9995Z"
								fill="currentColor"
							/>
							<path
								d="M13.0025 5.99945C13.0025 4.34398 14.3445 3.00195 16 3.00195H18C19.6555 3.00195 20.9975 4.34398 20.9975 5.99945V7.99945C20.9975 9.65493 19.6555 10.997 18 10.997H16C14.3445 10.997 13.0025 9.65493 13.0025 7.99945V5.99945Z"
								fill="currentColor"
							/>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M17 13.002C14.7922 13.002 13.0025 14.7917 13.0025 16.9995C13.0025 19.2072 14.7922 20.997 17 20.997C19.2078 20.997 20.9975 19.2072 20.9975 16.9995C20.9975 14.7917 19.2078 13.002 17 13.002ZM14.9975 16.9995C14.9975 15.8935 15.8941 14.997 17 14.997C18.106 14.997 19.0025 15.8935 19.0025 16.9995C19.0025 18.1054 18.106 19.002 17 19.002C15.8941 19.002 14.9975 18.1054 14.9975 16.9995Z"
								fill="currentColor"
							/>
						</svg>
					</button>
				)}
			</div>

			{/* Timeline */}
			<div className="shrink-0 border-t border-gray-6 min-h-[56px]">
				<div className="px-4 py-3 flex items-center gap-2 border-t border-gray-2">
					<span className="text-xs font-medium text-gray-10 uppercase tracking-wider shrink-0">
						Timeline
					</span>
					<div className="flex items-center gap-0 flex-1 min-w-0">
						{keyframes.map((k, i) => (
							<Fragment key={k.id}>
								{i > 0 ? (
									<div className="w-6 h-0.5 bg-gray-6 shrink-0 rounded-full" aria-hidden="true" />
								) : null}
								<button
									type="button"
									onClick={() => setActiveKeyframeId(k.id)}
									className="flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors data-active:bg-gray-4 data-active:text-gray-12 data-active:ring-1 data-active:ring-gray-8 text-gray-11 hover:text-gray-12 hover:bg-gray-3"
									data-active={activeKeyframeId === k.id ? true : undefined}
								>
									<span
										className={`w-2 h-2 rounded-full shrink-0 ${activeKeyframeId === k.id ? "bg-blue-9 opacity-100" : "bg-current opacity-50"}`}
										aria-hidden="true"
									/>
									<span className="truncate max-w-[100px]">{k.name}</span>
									{keyframes.length > 1 ? (
										<button
											type="button"
											aria-label={`Remove ${k.name}`}
											className="shrink-0 p-0.5 rounded hover:bg-gray-5 text-gray-10 hover:text-red-11"
											onClick={(e) => {
												e.stopPropagation();
												removeKeyframe(k.id);
											}}
										>
											<svg
												width="12"
												height="12"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
												aria-hidden="true"
											>
												<path d="M18 6 6 18" />
												<path d="m6 6 12 12" />
											</svg>
										</button>
									) : null}
								</button>
							</Fragment>
						))}
						<button
							type="button"
							onClick={addKeyframe}
							className="flex items-center justify-center w-8 h-8 rounded-md text-gray-10 hover:text-gray-12 hover:bg-gray-3 shrink-0 ml-1"
							aria-label="Add keyframe"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M12 5v14" />
								<path d="M5 12h14" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
