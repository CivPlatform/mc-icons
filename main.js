/*
Items: from https://minecraft.fandom.com/wiki/Item

```css
background-image: url(https://static.wikia.nocookie.net/minecraft_gamepedia/images/f/f5/ItemCSS.png/revision/latest?cb=20220125120756&amp;version=1643112327234&amp;format=original);
background-position: -32px -240px;
```

Blocks: from https://minecraft.fandom.com/wiki/Block

```
https://static.wikia.nocookie.net/minecraft_gamepedia/images/${url_part}.png/revision/latest/scale-to-height-down/64
```
*/

const fs = require("fs");
const https = require("https");

const capitalize = (s) => s[0].toUpperCase() + s.substring(1);

const pm_items = JSON.parse(fs.readFileSync("data/items.json"));
/** @type {{[name:string]:string}} */
const names_by_id = {};
for (let { name: id, displayName: name } of pm_items) {
	if (names_by_id[id])
		throw new Error(`Duplicate id '${id}' '${names_by_id[id]}' '${name}'`);
	// fix outdated names
	if (name === "Banner Pattern") name = id.split("_").map(capitalize).join(" ");
	names_by_id[id] = name;
}

// fix outdated names
names_by_id["light"] = "Light Block";
names_by_id["music_disc_otherside"] = "Otherside Disc";
names_by_id["music_disc_pigstep"] = "Pigstep Disc";

/** @type {{[name:string]:string}} */
const item_offsets_by_name = JSON.parse(
	fs.readFileSync("data/item_offsets.json")
);

/** @type {{[name:string]:string}} */
const block_imgs_by_name = JSON.parse(
	fs.readFileSync("data/block_imgs.json")
).by_name;

const item_infos = {};
const imgs_to_download = {};
for (const [id, name] of Object.entries(names_by_id)) {
	if (item_offsets_by_name[name]) {
		item_infos[id] = { name, offset: item_offsets_by_name[name] };
	} else if (block_imgs_by_name[name]) {
		imgs_to_download[id] = block_imgs_by_name[name];
		item_infos[id] = { name };
	} else
		console.error(`No img/offset(wiki) for name(pm): ${name} id(pm): ${id}`);
}

fs.mkdirSync("public/", { recursive: true });

fs.writeFileSync(
	"public/item_infos.json",
	JSON.stringify(item_infos).replaceAll("},", "},\n")
);

const atlasUrl =
	"https://static.wikia.nocookie.net/minecraft_gamepedia/images/f/f5/ItemCSS.png/revision/latest?cb=20220125120756&amp;version=1643112327234&amp;format=original";
https.get(atlasUrl, (res) => {
	const path = `public/items_atlas.png`;
	const ws = fs.createWriteStream(path);
	res.pipe(ws);
	ws.on("finish", () => {
		ws.close();
	});
});

fs.mkdirSync("public/icons/", { recursive: true });

for (const [id, img] of Object.entries(imgs_to_download)) {
	const url = `https://static.wikia.nocookie.net/minecraft_gamepedia/images/${img}.png/revision/latest/scale-to-height-down/64`;
	https.get(url, (res) => {
		const path = `public/icons/${id}.png`;
		const ws = fs.createWriteStream(path);
		res.pipe(ws);
		ws.on("finish", () => {
			ws.close();
		});
	});
}
