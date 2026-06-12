const encModules = import.meta.glob("@/assets/music/*.enc", {
    query: "?url",
    import: "default",
    eager: true,
});

const musicUrlMap = {};
for (const [path, url] of Object.entries(encModules)) {
    const musicId = path.split("/").pop().replace(".enc", "");
    musicUrlMap[musicId] = url;
}

export default musicUrlMap;
