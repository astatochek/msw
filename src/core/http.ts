import {
  DefaultBodyType,
  RequestHandlerOptions,
  ResponseResolver,
} from './handlers/RequestHandler'
import {
  HttpMethods,
  HttpHandler,
  HttpRequestResolverExtras,
} from './handlers/HttpHandler'
import type { Path, PathParams } from './utils/matching/matchRequestUrl'

type ExtractRestParams<T extends Path> = {
  [Key in Split<
    T extends string ? T : ''
  >[number] as Key extends `:${infer Param}` ? Param : never]: string | string[]
} & {}
type Split<T extends string> = SplitFromParts<[T]>
type SplitFromParts<T extends string[]> = T extends [...infer Start, infer End]
  ? End extends `${infer PathPart}/${infer Rest}`
    ? [...Start, PathPart, ...SplitFromParts<[Rest]>]
    : [End]
  : []

export type HttpRequestHandler<RequestPath extends Path> = <
  RequestBodyType extends DefaultBodyType = DefaultBodyType,
  // Response body type MUST be undefined by default.
  // This is how we can distinguish between a handler that
  // returns plain "Response" and the one returning "HttpResponse"
  // to enforce a stricter response body type.
  ResponseBodyType extends DefaultBodyType = undefined,
>(
  path: RequestPath,
  resolver: HttpResponseResolver<
    ExtractRestParams<RequestPath>,
    RequestBodyType,
    ResponseBodyType
  >,
  options?: RequestHandlerOptions,
) => HttpHandler

export type HttpResponseResolver<
  Params extends PathParams,
  RequestBodyType extends DefaultBodyType = DefaultBodyType,
  ResponseBodyType extends DefaultBodyType = DefaultBodyType,
> = ResponseResolver<
  HttpRequestResolverExtras<Params>,
  RequestBodyType,
  ResponseBodyType
>

function createHttpHandler<Method extends HttpMethods | RegExp>(
  method: Method,
) {
  function handler<RequestPath extends Path>(
    ...args: Parameters<HttpRequestHandler<RequestPath>>
  ): ReturnType<HttpRequestHandler<RequestPath>> {
    const [path, resolver, options = {}] = args
    return new HttpHandler(method, path, resolver, options)
  }

  return handler
}

/**
 * A namespace to intercept and mock HTTP requests.
 *
 * @example
 * http.get('/user', resolver)
 * http.post('/post/:id', resolver)
 *
 * @see {@link https://mswjs.io/docs/api/http `http` API reference}
 */
export const http = {
  all: createHttpHandler(/.+/),
  head: createHttpHandler(HttpMethods.HEAD),
  get: createHttpHandler(HttpMethods.GET),
  post: createHttpHandler(HttpMethods.POST),
  put: createHttpHandler(HttpMethods.PUT),
  delete: createHttpHandler(HttpMethods.DELETE),
  patch: createHttpHandler(HttpMethods.PATCH),
  options: createHttpHandler(HttpMethods.OPTIONS),
}
