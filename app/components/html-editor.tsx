import { html } from "@codemirror/lang-html";
import { codeFolding, foldGutter } from "@codemirror/language";
import CodeMirror from "@uiw/react-codemirror";

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

const codeMirrorClassName =
	"h-fit text-gray-12 text-[13px] py-4 [&_.cm-editor]:h-full [&_.cm-editor]:bg-transparent! [&_.cm-scroller]:min-h-[200px] [&_.cm-lineNumbers]:hidden! [&_.cm-content]:bg-transparent [&_.cm-gutters]:bg-gray-3! [&_.cm-gutters]:border-none! [&_.cm-scroller]:font-mono! [&_.cm-scroller]:leading-normal! [&_.cm-focused]:outline-none! [&_.cm-gutterElement]:w-10 [&_.cm-gutterElement]:flex [&_.cm-gutterElement]:justify-center [&_.cm-gutterElement_span]:w-[19.5px]  [&_.cm-gutterElement_span]:flex! [&_.cm-gutterElement_span]:items-center! [&_.cm-gutterElement_span]:justify-center! [&_.cm-gutterElement_span]:h-[19.5px] [&_.cm-gutterElement_span]:hover:bg-gray-4 [&_.cm-gutterElement_span]:rounded";

type HtmlEditorProps = {
	value: string;
	onChange: (html: string) => void;
};

export function HtmlEditor({ value, onChange }: HtmlEditorProps) {
	if (!value) {
		return (
			<div className="flex flex-col items-center justify-center grow text-gray-11 gap-2 p-6 text-center">
				<p className="font-medium">Paste HTML in the preview to see the code here</p>
				<p className="text-sm text-gray-10">
					Use Cmd+V (Mac) or Ctrl+V (Windows) in the preview panel.
				</p>
			</div>
		);
	}
	return (
		<CodeMirror
			value={value}
			onChange={onChange}
			extensions={[
				html(),
				codeFolding(),
				foldGutter({ markerDOM: createFoldMarker }),
			]}
			basicSetup={{ foldGutter: false }}
			className={codeMirrorClassName}
		/>
	);
}
