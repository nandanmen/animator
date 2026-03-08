import { useState } from "react";

type KeyframeChange =
	| { type: "removed"; path: string; tagName: string; class?: string }
	| { type: "added"; path: string; tagName: string; class?: string }
	| { type: "classChanged"; path: string; tagName: string; from: string; to: string };

function getElementMap(
	html: string,
): Map<string, { tagName: string; class: string | undefined }> {
	const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
	const wrap = doc.body.firstElementChild;
	if (!wrap) return new Map();
	const map = new Map<string, { tagName: string; class: string | undefined }>();

	function visit(el: Element, path: string) {
		const tagName = el.tagName.toLowerCase();
		const cls = el.getAttribute("class") ?? undefined;
		map.set(path, { tagName, class: cls });
		let i = 0;
		for (const child of el.children) {
			visit(child, path ? `${path}.${i}` : String(i));
			i++;
		}
	}

	let i = 0;
	for (const child of wrap.children) {
		visit(child, String(i));
		i++;
	}
	return map;
}

function compareKeyframes(prevHtml: string, currHtml: string): KeyframeChange[] {
	const prevMap = getElementMap(prevHtml);
	const currMap = getElementMap(currHtml);
	const changes: KeyframeChange[] = [];

	for (const [path, prevEntry] of prevMap) {
		if (!currMap.has(path)) {
			changes.push({
				type: "removed",
				path,
				tagName: prevEntry.tagName,
				class: prevEntry.class,
			});
		} else {
			const currEntry = currMap.get(path)!;
			if (currEntry.tagName === prevEntry.tagName) {
				const prevClass = prevEntry.class ?? "";
				const currClass = currEntry.class ?? "";
				if (prevClass !== currClass) {
					changes.push({
						type: "classChanged",
						path,
						tagName: currEntry.tagName,
						from: prevClass,
						to: currClass,
					});
				}
			}
		}
	}

	for (const [path, currEntry] of currMap) {
		if (!prevMap.has(path)) {
			changes.push({
				type: "added",
				path,
				tagName: currEntry.tagName,
				class: currEntry.class,
			});
		}
	}

	return changes;
}

type TreeNode = {
	change: KeyframeChange;
	path: string;
	children: TreeNode[];
};

function buildTree(changes: KeyframeChange[]): TreeNode[] {
	const nodes = changes
		.slice()
		.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
		.map((change) => ({ change, path: change.path, children: [] as TreeNode[] }));
	const pathToNode = new Map<string, TreeNode>();
	for (const node of nodes) {
		pathToNode.set(node.path, node);
	}
	const roots: TreeNode[] = [];
	for (const node of nodes) {
		const dot = node.path.lastIndexOf(".");
		const parentPath = dot >= 0 ? node.path.slice(0, dot) : null;
		if (parentPath === null) {
			roots.push(node);
		} else {
			const parent = pathToNode.get(parentPath);
			if (parent) {
				parent.children.push(node);
			} else {
				roots.push(node);
			}
		}
	}
	return roots;
}

function ChangeLabel({ change }: { change: KeyframeChange }) {
	if (change.type === "removed") {
		return (
			<span className="text-red-11">
				Removed <code className="text-[11px]">&lt;{change.tagName}&gt;</code>
				{change.class ? ` ${change.class.slice(0, 20)}${change.class.length > 20 ? "…" : ""}` : ""}
			</span>
		);
	}
	if (change.type === "added") {
		return (
			<span className="text-green-11">
				Added <code className="text-[11px]">&lt;{change.tagName}&gt;</code>
				{change.class ? ` ${change.class.slice(0, 20)}${change.class.length > 20 ? "…" : ""}` : ""}
			</span>
		);
	}
	return (
		<span className="text-gray-11">
			<code className="text-[11px]">&lt;{change.tagName}&gt;</code> class:{" "}
			{change.from.slice(0, 15)}
			{change.from.length > 15 ? "…" : ""} → {change.to.slice(0, 15)}
			{change.to.length > 15 ? "…" : ""}
		</span>
	);
}

type KeyframeChangesSidebarProps = {
	prevHtml: string;
	currHtml: string;
};

export function KeyframeChangesSidebar({ prevHtml, currHtml }: KeyframeChangesSidebarProps) {
	const changes = compareKeyframes(prevHtml, currHtml);
	const tree = buildTree(changes);
	const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

	const toggle = (path: string) => {
		setExpandedPaths((prev) => {
			const next = new Set(prev);
			if (next.has(path)) next.delete(path);
			else next.add(path);
			return next;
		});
	};

	return (
		<aside className="shrink-0 w-60 flex flex-col overflow-hidden">
			<p className="text-sm font-medium text-gray-12 mb-2">Keyframe changes</p>
			<ul className="list-none p-0 m-0 flex flex-col overflow-auto min-h-0 text-sm">
				{tree.length === 0 ? (
					<li className="text-gray-11">No changes</li>
				) : (
					tree.map((node) => (
						<TreeItem
							key={`${node.change.type}-${node.path}`}
							node={node}
							expandedPaths={expandedPaths}
							onToggle={toggle}
							depth={0}
						/>
					))
				)}
			</ul>
		</aside>
	);
}

function TreeItem({
	node,
	expandedPaths,
	onToggle,
	depth,
}: {
	node: TreeNode;
	expandedPaths: Set<string>;
	onToggle: (path: string) => void;
	depth: number;
}) {
	const hasChildren = node.children.length > 0;
	const isExpanded = expandedPaths.has(node.path);

	return (
		<li className="flex flex-col gap-0.5">
			<div
				className="flex items-center gap-1 truncate min-w-0"
				style={{ paddingLeft: `${depth * 12}px` }}
			>
				{hasChildren ? (
					<button
						type="button"
						aria-expanded={isExpanded}
						aria-label={isExpanded ? "Collapse" : "Expand"}
						className="shrink-0 p-0.5 rounded hover:bg-gray-4 text-gray-11 inline-flex items-center justify-center"
						onClick={() => onToggle(node.path)}
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
							className={isExpanded ? "rotate-90" : ""}
							aria-hidden
						>
							<title>Expand or collapse</title>
							<path d="M9 18l6-6-6-6" />
						</svg>
					</button>
				) : (
					<span className="w-5 shrink-0 inline-block" aria-hidden />
				)}
				<span className="truncate min-w-0">
					<ChangeLabel change={node.change} />
				</span>
			</div>
			{hasChildren && isExpanded && (
				<ul className="list-none p-0 m-0 flex flex-col gap-0.5">
					{node.children.map((child) => (
						<TreeItem
							key={`${child.change.type}-${child.path}`}
							node={child}
							expandedPaths={expandedPaths}
							onToggle={onToggle}
							depth={depth + 1}
						/>
					))}
				</ul>
			)}
		</li>
	);
}
