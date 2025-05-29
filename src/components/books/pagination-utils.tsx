// Utility function to build URL with all parameters
export function buildBookListUrl(params: {
  page?: number
  search?: string
  status?: string
  author?: string
  sort?: string
  view?: string
}) {
  const searchParams = new URLSearchParams()

  if (params.page && params.page > 1) {
    searchParams.set("page", params.page.toString())
  }

  if (params.search) {
    searchParams.set("search", params.search)
  }

  if (params.status) {
    searchParams.set("status", params.status)
  }

  if (params.author) {
    searchParams.set("author", params.author)
  }

  if (params.sort && params.sort !== "newest") {
    searchParams.set("sort", params.sort)
  }

  if (params.view && params.view !== "grid") {
    searchParams.set("view", params.view)
  }

  const queryString = searchParams.toString()
  return `/admin/books${queryString ? `?${queryString}` : ""}`
}
