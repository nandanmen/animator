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

function buildPreviewDocument(bodyHtml: string): string {
	const scriptBody = PICKER_SCRIPT.replace(/<\/script>/gi, "</scr" + "ipt>");
	return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><script src="${TAILWIND_CDN}"></script><style>${PICKER_HOVER_STYLES}</style></head><body class="h-screen flex items-center justify-center">${bodyHtml}<script>${scriptBody}</script></body></html>`;
}

type PreviewPanelProps = {
	html: string | null;
	onPaste: (e: React.ClipboardEvent) => void;
};

export function PreviewPanel({ html, onPaste }: PreviewPanelProps) {
	return (
		<section
			className="flex flex-col grow bg-gray-1 rounded-xl shadow-sm min-h-0 outline-none focus:ring-2 focus:ring-blue-6 focus:ring-offset-2"
			onPaste={onPaste}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: paste target must be focusable for Cmd+V
			tabIndex={0}
			aria-label="Preview: paste HTML here"
		>
			{html ? (
				<iframe
					srcDoc={buildPreviewDocument(html)}
					title="HTML preview with Tailwind"
					className="w-full h-full min-h-[320px] border-0 rounded-xl bg-white"
					sandbox="allow-same-origin allow-scripts"
				/>
			) : null}
		</section>
	);
}
