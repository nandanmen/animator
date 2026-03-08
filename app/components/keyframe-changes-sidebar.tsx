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

	function strictPrefixes(p: string): string[] {
		const parts = p.split(".");
		const result: string[] = [];
		for (let i = 1; i < parts.length; i++) {
			result.push(parts.slice(0, i).join("."));
		}
		return result;
	}

	for (const [path, prevEntry] of prevMap) {
		if (!currMap.has(path)) {
			const ancestors = strictPrefixes(path);
			if (ancestors.every((prefix) => currMap.has(prefix))) {
				changes.push({
					type: "removed",
					path,
					tagName: prevEntry.tagName,
					class: prevEntry.class,
				});
			}
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
			const ancestors = strictPrefixes(path);
			if (ancestors.every((prefix) => prevMap.has(prefix))) {
				changes.push({
					type: "added",
					path,
					tagName: currEntry.tagName,
					class: currEntry.class,
				});
			}
		}
	}

	return changes;
}

type KeyframeChangesSidebarProps = {
	prevHtml: string;
	currHtml: string;
};

export function KeyframeChangesSidebar({ prevHtml, currHtml }: KeyframeChangesSidebarProps) {
	const changes = compareKeyframes(prevHtml, currHtml);

	return (
		<aside className="shrink-0 w-60 flex flex-col overflow-hidden">
			<p className="text-sm font-medium text-gray-12 mb-2">Keyframe changes</p>
			<ul className="list-none p-0 m-0 flex flex-col gap-1.5 overflow-auto min-h-0 text-sm">
				{changes.length === 0 ? (
					<li className="text-gray-11">No changes</li>
				) : (
					changes.map((change) => (
						<li key={`${change.type}-${change.path}`} className="truncate">
							{change.type === "removed" && (
								<span className="text-red-11">
									Removed <code className="text-[11px]">&lt;{change.tagName}&gt;</code>
									{change.class ? ` ${change.class.slice(0, 20)}${change.class.length > 20 ? "…" : ""}` : ""}
								</span>
							)}
							{change.type === "added" && (
								<span className="text-green-11">
									Added <code className="text-[11px]">&lt;{change.tagName}&gt;</code>
									{change.class ? ` ${change.class.slice(0, 20)}${change.class.length > 20 ? "…" : ""}` : ""}
								</span>
							)}
							{change.type === "classChanged" && (
								<span className="text-gray-11">
									<code className="text-[11px]">&lt;{change.tagName}&gt;</code> class:{" "}
									{change.from.slice(0, 15)}
									{change.from.length > 15 ? "…" : ""} → {change.to.slice(0, 15)}
									{change.to.length > 15 ? "…" : ""}
								</span>
							)}
						</li>
					))
				)}
			</ul>
		</aside>
	);
}
