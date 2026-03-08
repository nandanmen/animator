export type Keyframe = {
	id: string;
	name: string;
	html: string;
};

export type NodeProperties = {
	tagName: string;
	attributes: Record<string, string>;
};
