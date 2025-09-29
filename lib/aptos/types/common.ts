import type { MoveFunctionId } from "@aptos-labs/ts-sdk";

/**
 * The generic structure for any entry function payload returned by our server.
 * This can be reused across all transaction types.
 */
export interface EntryFunctionPayload {
  function: MoveFunctionId;
  functionArguments: (string | number | boolean)[];
  typeArguments?: string[];
}

/**
 * Props genéricas para una página de Next.js que recibe un parámetro dinámico.
 * @template T El nombre del parámetro, por defecto 'id'.
 */
export type PageProps<T extends string = "id"> = {
  params: { [key in T]: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};
