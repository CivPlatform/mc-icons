const fs = require("fs");
const https = require("https");

const capitalize = (s) => s[0].toUpperCase() + s.substring(1);

const pm_items = JSON.parse(fs.readFileSync("data/items.json"));
/** @type {Map<string,string>} */
const names_by_id = new Map();
for (let { name: id, displayName: name } of pm_items) {
	if (names_by_id.has(id))
		throw new Error(`Duplicate id '${id}' '${names_by_id.get(id)}' '${name}'`);
	// fix reused names
	if (name === "Music Disc") name = id.split("_").map(capitalize).join(" ");
	if (name === "Smithing Template")
		name = id.split("_").map(capitalize).join(" ");
	names_by_id.set(id, name);
}

/*
https://minecraft.fandom.com/wiki/Block
```js
imgs = document.querySelectorAll("ul>li img.hoverZoomLink.mw-file-element");
block_imgs_by_name = {};
for (let i = 0; i < imgs.length; ++i) {
	e = imgs[i].parentElement.parentElement.parentElement;
	name = e.querySelector("a[title]").innerText.replace(' (block)', '');
	if (name === 'Light Block') name = 'Light';
	if (block_imgs_by_name[name]) continue; // skip legacy
	block_imgs_by_name[name] = e.src.replace("/thumb", "").replace(/\.png.+/, ".png");
}
console.log(JSON.stringify(block_imgs_by_name).replaceAll('","', '",\n"'));
```
*/
const block_imgs_by_name = JSON.parse(
	fs.readFileSync("data/block_imgs_by_name.json")
);

const item_infos = {};
const imgs_to_download = new Map();
for (let [id, name] of names_by_id.entries()) {
	item_infos[id] = { name };

	if (block_imgs_by_name[name]) {
		imgs_to_download.set(id, block_imgs_by_name[name]);
	} else {
		// representatives
		if (name.includes("Potion")) name = name.replace("Potion", "Water Bottle");
		if (id === "tipped_arrow") name = "Arrow of Splashing";
		if (id === "debug_stick") name = "Stick";
		// misnamed files
		if (id === "golden_horse_armor") name = name.replace("Golden", "Gold");
		if (id === "honey_bottle") name = "Honey";
		if (id.endsWith("_smithing_template"))
			name = name.replace(" Smithing Template", "");
		if (id === "shaper_armor_trim_smithing_template") name = "Armor Trim";

		const dashed = name
			.toLowerCase()
			.replaceAll(" ", "-")
			.replaceAll("'", "%27");
		let url = `https://minecraft.wiki/images/ItemSprite_${dashed}.png`;
		imgs_to_download.set(id, url);
	}
}

fs.mkdirSync("public/", { recursive: true });

fs.writeFileSync(
	"public/item_infos.json",
	JSON.stringify(item_infos).replaceAll("},", "},\n")
);

fs.mkdirSync("public/icons/", { recursive: true });

(async () => {
	const jobs = [...imgs_to_download.entries()].sort();
	const batchSize = 30;
	for (let i = 0; i < jobs.length; i += batchSize) {
		const promises = [];
		for (let j = 0; j < batchSize; j++) {
			if (i + j >= jobs.length) break;
			const [id, url] = jobs[i + j];
			const path = `public/icons/${id}.png`;
			if (fs.existsSync(path)) continue;
			// console.log(path, url);
			promises.push(
				fetch(url)
					.then((res) => res.arrayBuffer())
					.then((data) => fs.writeFileSync(path, Buffer.from(data)))
			);
		}
		await Promise.all(promises);
	}
})();
