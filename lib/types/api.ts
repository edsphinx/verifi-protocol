/**
 * @notice Reusable type for the context object passed to Next.js dynamic API routes.
 * @dev This correctly types the `params` object provided by the App Router.
 * This non-generic version is more robust for Next.js build-time type checking.
 */
export interface RouteContext {
  params: {
    id: string;
  };
}
