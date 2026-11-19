type CookieRequest = { headers: { cookie?: string } };

export function getCookie(request: CookieRequest, name: string): string | undefined {
    const entry = request.headers.cookie?.split(';').find((item) => item.trim().startsWith(`${name}=`));
    return entry ? decodeURIComponent(entry.trim().slice(name.length + 1)) : undefined;
}
