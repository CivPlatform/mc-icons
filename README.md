# MC-Icons

```css
/* blocks: */
background-image: url("https://mc-icons.netlify.app/icons/${id}.png");
background-size: contain;

/* items: */
background-image: url("https://mc-icons.netlify.app/items_atlas.png");
background-position: ${offset};
image-rendering: pixelated;
```

Full example: [tech-tree-explorer](https://github.com/CivPlatform/tech-tree-explorer/blob/master/src/ItemIcon.tsx)

---

https://mc-icons.netlify.app/item_infos.json maps block/item `id` (in lower_snake_case) to their display `name`; items also map to an `offset`.

All item icons are in one big atlas image; the `offset` is used to select one icon.
This means the element must be sized 16x16 px, or adjacent icons will be visible.

Block icons are from https://minecraft.fandom.com/wiki/Block  
Item icons are from https://minecraft.fandom.com/wiki/Item
