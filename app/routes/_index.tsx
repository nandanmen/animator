import * as beautify from "js-beautify";
import { useCallback, useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { HtmlEditor } from "~/components/html-editor";
import { KeyframeChangesSidebar } from "~/components/keyframe-changes-sidebar";
import { PreviewPanel } from "~/components/preview-panel";
import { Timeline } from "~/components/timeline";
import type { Keyframe, NodeProperties } from "~/lib/types";

const CODE_STORAGE_KEY = "animator-code";
const KEYFRAMES_STORAGE_KEY = "animator-keyframes";

export type { Keyframe, NodeProperties } from "~/lib/types";

function nextKeyframeName(keyframes: Keyframe[]): string {
	const n = keyframes.length + 1;
	return `Keyframe ${n}`;
}

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
	// biome-ignore lint/correctness/noUnusedVariables: kept for future Attributes panel
	const [selectedNode, setSelectedNode] = useState<NodeProperties | null>(null);
	// biome-ignore lint/correctness/noUnusedVariables: kept for future Attributes panel
	const [attributesPanelOpen, setAttributesPanelOpen] = useState(true);

	const activeKeyframe = keyframes.find((k) => k.id === activeKeyframeId) ?? keyframes[0];
	const activeIndex = keyframes.findIndex((k) => k.id === activeKeyframeId);
	const prevKeyframe = activeIndex > 0 ? keyframes[activeIndex - 1] ?? null : null;
	const setActiveKeyframeHtml = useCallback(
		(html: string) => {
			if (!activeKeyframe) return;
			const targetId = activeKeyframe.id;
			setKeyframesState((prev) => ({
				...prev,
				keyframes: prev.keyframes.map((k) => (k.id === targetId ? { ...k, html } : k)),
			}));
		},
		[activeKeyframe],
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
		[setActiveKeyframeHtml],
	);

	return (
		<div className="flex flex-col h-screen">
			<div className="flex grow overflow-hidden">
				<Group orientation="horizontal" className="grow py-4 pr-4">
					<Panel
						id="code"
						defaultSize={480}
						minSize={480}
						maxSize={600}
						className="flex flex-col overflow-visible!"
					>
						<div className="flex flex-col grow overflow-auto min-h-0 -mb-4">
							<HtmlEditor
								value={activeKeyframe?.html ?? ""}
								onChange={setActiveKeyframeHtml}
							/>
						</div>
					</Panel>

					<Separator className="w-2 mx-1 rounded shrink-0 bg-transparent transition-colors hover:bg-gray-6 data-[data-separator=active]:bg-blue-6" />

					<Panel id="preview" minSize={240} className="flex flex-col overflow-visible!">
						<PreviewPanel
							html={activeKeyframe?.html ?? null}
							onPaste={handlePaste}
						/>
					</Panel>
				</Group>
				{activeIndex > 0 && prevKeyframe && activeKeyframe ? (
					<KeyframeChangesSidebar
						prevHtml={prevKeyframe.html}
						currHtml={activeKeyframe.html}
					/>
				) : null}
			</div>

			<Timeline
				keyframes={keyframes}
				activeKeyframeId={activeKeyframeId}
				onSelect={setActiveKeyframeId}
				onAdd={addKeyframe}
				onRemove={removeKeyframe}
			/>
		</div>
	);
}
