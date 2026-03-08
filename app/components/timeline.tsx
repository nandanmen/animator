import { Fragment } from "react";
import type { Keyframe } from "~/lib/types";

type TimelineProps = {
	keyframes: Keyframe[];
	activeKeyframeId: string;
	onSelect: (id: string) => void;
	onAdd: () => void;
	onRemove: (id: string) => void;
};

export function Timeline({
	keyframes,
	activeKeyframeId,
	onSelect,
	onAdd,
	onRemove,
}: TimelineProps) {
	return (
		<div className="shrink-0 border-t border-gray-6 h-60">
			<div className="h-full px-4 py-3 flex items-center justify-center gap-2 border-t border-gray-2">
				<div className="flex items-center">
					{keyframes.map((k, i) => (
						<Fragment key={k.id}>
							{i > 0 ? (
								<div className="w-6 h-0.5 bg-gray-6 shrink-0 rounded-full" aria-hidden="true" />
							) : null}
							<button
								type="button"
								onClick={() => onSelect(k.id)}
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
											onRemove(k.id);
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
						onClick={onAdd}
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
	);
}
