import type { TChatModel, TChatModelList } from "@app/schemas";
import { A } from "@mobily/ts-belt";
import type {
	TInferenceCatalog,
	TInferenceModel,
} from "#/chat/domain/inference.ts";

const toChatModelDto = (
	model: TInferenceModel,
	loaded: string | null,
): TChatModel => ({
	id: model.id,
	name: model.name,
	architecture: model.arch,
	sizeGb: model.size_gb,
	supported: model.supported,
	loaded: model.id === loaded,
});

export const toChatModelListDto = (
	catalog: TInferenceCatalog,
): TChatModelList => ({
	models: [
		...A.map(catalog.models, (model) => toChatModelDto(model, catalog.loaded)),
	],
});
