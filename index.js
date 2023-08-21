const root = getComputedStyle(document.body);
const scrollArea = document.getElementById("scroll_area");
const map = document.getElementById("map");
const cardMargin = parseFloat(root.getPropertyValue("--card-margin"));
const mapItemMargin = parseFloat(root.getPropertyValue("--map-item-margin"));
const mapMargin = parseFloat(root.getPropertyValue("--map-margin"));
const yearMargin = parseFloat(root.getPropertyValue("--year-margin"));

let mapWidth = map.getBoundingClientRect().width;
let cardWidth = scrollArea.children[0].getBoundingClientRect().width;
let itemWidth = [...map.children].find(
    (item) => item.className === "map_item"
).getBoundingClientRect().width;
let yearWidth = [...map.children].find(
    (item) => item.className === "year"
).getBoundingClientRect().width;

let mapWindow = document.getElementById("window");
let windowOffset = document.getElementById("window_offset");
let windowWidth = 0;

let json = [{ name: "Loading...", height: 1, year: 2023 }];

fetchItems();
// json = [];
// for (let i = 0; i < 30; i++) {
//     json.push({ name: `Test ${i + 1}`, height: (Math.random() + 0.1) / 1.1, year: 2023 });
// }
// for (let i = 0; i < 30; i++) {
//     json.push({ name: `Test ${i + 21}`, height: (Math.random() + 0.1) / 1.1, year: 2022 });
// }

async function fetchItems() {
    let jsonOffset = 0;
    let total = 0;
    try {
        // Fetch first 100 items and get the total items number
        let response = await fetch(
            `https://algorithms.design/api/v1/item?id=6304bbde7a4071611257d45e&offset=${jsonOffset}&limit=100`
        );
        response = await response.json();
        total = response.total;
        json = [...response.items];

        // Fetch the rest of items
        for (jsonOffset = 100; jsonOffset < total; jsonOffset += 100) {
            response = await fetch(
                `https://algorithms.design/api/v1/item?id=6304bbde7a4071611257d45e&offset=${jsonOffset}&limit=100`
            );
            response = await response.json();
            json = json.concat(json, response.items);
        }
    } catch (err) {
        console.log(err);
        json = [{ name: "Failed to fetch data", height: 1, year: 2023 }];
    }

    // Sort items by year
    json.sort((a, b) => b.year - a.year);

    // Calculate maximum sorting
    let maxSorting = json[0].sorting;
    for (const item of json) {
        if (item.sorting > maxSorting) {
            maxSorting = item.sorting;
        }
    }

    // Normalize sort
    for (const item of json) {
        item.height = (item.sorting + 1) / (maxSorting + 1);
    }

    resize();
}

const deceleration = 1.01;
const maxSpeed = 200.0;

let offset = 0;
let limit = 1;
let itemOffset = 0;
let itemLimit = 10;
let maxOffset = 0.0;
let scrollOffset = 0.0;
let speed = 0.0;
let toOffset = 0;
let scrollToActive = false;

function scrollTo(off) {
    let yearCount = 0;
    for (let i = 1; i < map.children.length; i++) {
        const item = map.children[i];
        if (item.className === "year") {
            yearCount++;
        }
    }
    toOffset = off * (cardWidth + cardMargin) + (yearWidth + yearMargin) * yearCount;
    if (itemOffset >= json.length - itemLimit && window.innerWidth < window.innerHeight) toOffset += yearWidth / itemWidth * cardWidth - cardWidth;

    scrollToActive = true;
    if (toOffset < scrollOffset - maxSpeed / 2) {
        speed = -maxSpeed;
        window.requestAnimationFrame(scrollAnimation);
    } else if (toOffset > scrollOffset + maxSpeed / 2) {
        speed = maxSpeed;
        window.requestAnimationFrame(scrollAnimation);
    } else {
        scrollToActive = false;
    }
}

function renderItems(itemsJson) {
    map.textContent = "";

    // Add first year item
    const firstItem = itemsJson[offset];
    if (firstItem) {
        const currentYear = document.createElement("div");
        currentYear.className = "year";
        currentYear.textContent = firstItem.year;
        currentYear.style.position = "absolute";
        currentYear.style.left = `${mapMargin}px`;
        currentYear.style.zIndex = 1000;
        currentYear.style.cursor = 'initial';
        map.appendChild(currentYear);
    }

    let itemEnd = itemOffset + itemLimit;
    if (itemEnd > itemsJson.length) itemEnd = itemsJson.length;
    let itemStart =
        itemsJson.length - itemOffset < itemLimit
            ? itemsJson.length - itemLimit
            : itemOffset;
    if (itemStart < 0) itemStart = 0;
    let lastYear = firstItem;

    if (itemOffset > itemsJson.length - itemLimit) {
        map.textContent = "";
        lastYear = null;
    }

    // Add map items
    for (let i = itemStart; i < itemEnd; i++) {
        const item = itemsJson[i];

        // Add year item if needed
        if (item.year != lastYear?.year) {
            const yearItem = document.createElement("div");
            yearItem.className = "year";
            yearItem.textContent = item.year;
            yearItem.style.zIndex = 1000 - i;
            yearItem.onclick = () => scrollTo(i);
            if (lastYear === null) {
                yearItem.style.position = "absolute";
                yearItem.style.left = `${mapMargin}px`;
                yearItem.style.zIndex = 1000;
            }
            map.appendChild(yearItem);
            lastYear = item;
        }

        const mapItemFiller = document.createElement("div");
        mapItemFiller.className = "map_item_filler";
        mapItemFiller.style.setProperty("--size-y", `${item.height}`);

        const mapItem = document.createElement("div");
        mapItem.className = "map_item";
        mapItem.onclick = () => scrollTo(i);
        mapItem.appendChild(mapItemFiller);
        map.appendChild(mapItem);
    }

    // Create window to tint invisible items
    mapWindow = document.createElement("div");
    mapWindow.className = "window";
    mapWindow.style.setProperty("--window-width", `${windowWidth}px`);
    map.appendChild(mapWindow);

    let winOffset = 0;
    windowOffset = document.createElement("div");
    windowOffset.className = "window_offset";
    windowOffset.style.setProperty("--window-offset", `${winOffset}px`);
    map.appendChild(windowOffset);

    if (scrollArea.children.length !== Math.ceil(limit) || scrollToActive) {
        console.log('clear scroll area!', { length: scrollArea.children.length, limit: Math.ceil(limit) });
        scrollArea.textContent = "";
        let end = offset + limit;
        if (end > json.length) end = json.length;

        // Add cards
        for (let i = offset; i < end; i++) {
            const card = document.createElement("div");
            card.className = "card";
            card.id = i;
            if (itemsJson[i].thumbnail) card.innerHTML = `<img src="${itemsJson[i].thumbnail?.url}" alt="${itemsJson[i].thumbnail?.alt}" />`;
            card.innerHTML += `
<h1 id="${i}">${itemsJson[i].name}</h1>
${itemsJson[i].short}
<a href="${itemsJson[i]["external-url"]}">Read more</a>
`;
            scrollArea.appendChild(card);
        }
    } else {
        let counter = 0;
        let end = offset + limit;
        if (end > json.length) end = json.length;

        // Update cards
        for (let i = offset; i < end; i++, counter++) {
            const card = scrollArea.children[counter];
            card.textContent = "";
            card.id = i;
            if (itemsJson[i].thumbnail) card.innerHTML = `<img src="${itemsJson[i].thumbnail?.url}" alt="${itemsJson[i].thumbnail?.alt}" />`;
            card.innerHTML += `
<h1 id="${i}">${itemsJson[i].name}</h1>
${itemsJson[i].short}
<a href="${itemsJson[i]["external-url"]}">Read more</a>
`;
        }
    }
}

renderItems(json);

function scrollAnimation(timestamp) {
    const scaleCoef = (itemWidth + mapItemMargin) / (cardWidth + cardMargin);
    const scaledOffset = scrollOffset * scaleCoef;

    scrollOffset += speed;
    if (!scrollToActive) speed /= deceleration;
    else if (Math.abs(scrollOffset - toOffset) <= maxSpeed * 2) speed /= 2;

    if (scrollOffset < 0) {
        scrollOffset = 0;
    } else if (scrollOffset > maxOffset) {
        scrollOffset = maxOffset;
    }

    // Calculate item offsets
    let offsetX = scrollOffset;
    let skip = 0;
    while (offsetX - (cardWidth + cardMargin) > 0) {
        offsetX -= cardWidth + cardMargin;
        skip++;
    }

    let itemSkip = 0;
    let itemOffsetX = scaledOffset;
    while (itemOffsetX - (itemWidth + mapItemMargin) > 0) {
        itemOffsetX -= itemWidth + mapItemMargin;
        itemSkip++;
    }

    // Redraw items if necessary
    if (itemSkip !== itemOffset) {
        itemOffset = Math.floor(itemSkip);
        renderItems(json);
    }

    if (skip !== offset) {
        offset = Math.floor(skip);
        renderItems(json);
    }

    // Change offset if total width is not enough to cover the whole map
    if (itemOffset >= json.length - itemLimit) itemOffsetX = 0.0;

    // Update CSS properties for all items
    for (const child of scrollArea.children) {
        child.style.setProperty("--offset-x", `-${offsetX}px`);
    }

    for (let i = 1; i < map.children.length; i++) {
        const child = map.children[i];
        child.style.setProperty("--offset-x", `-${itemOffsetX}px`);
    }

    // Move window if necessary
    if (itemOffset >= json.length - itemLimit) {
        let winOffset = windowWidth - (maxOffset - scrollOffset) * scaleCoef;
        if (winOffset < 0) winOffset = 0.0;
        if (winOffset > mapWidth - yearWidth - yearMargin * 2 - itemWidth) winOffset = mapWidth - yearWidth - yearMargin * 2 - itemWidth;
        map.children[map.children.length - 1].style.setProperty(
            "--window-offset",
            `${winOffset}px`
        );
        map.children[map.children.length - 2].style.setProperty(
            "--window-width",
            `${windowWidth - winOffset < itemWidth ? 0 : windowWidth - winOffset}px`
        );
    }

    // Next animation frame if necessary
    if (speed > 0.1 || speed < -0.1) {
        window.requestAnimationFrame(scrollAnimation);
    } else {
        scrollToActive = false;
    }
}

addEventListener("wheel", (event) => {
    scrollToActive = false;
    speed += event.deltaY / 100;
    if (speed > maxSpeed) speed = maxSpeed;
    else if (speed < -maxSpeed) speed = -maxSpeed;
    window.requestAnimationFrame(scrollAnimation);
});

let startCoords = null;
let prevCoords = null;
let currCoords = null;
let prevOffset = 0;

window.addEventListener(
    "touchstart",
    (event) => {
        if (event.target === map) return;
        for (const touch of event.touches) {
            speed = 0;
            lastDelta = 0;
            startCoords = {
                x: touch.pageX,
                y: touch.pageY
            };
            currCoords = { ...startCoords };
            prevCoords = { ...startCoords };
            prevOffset = scrollOffset;
        }
    },
    false
);

window.addEventListener("touchmove", (event) => {
    for (const touch of event.touches) {
        const deltaX = startCoords.x - touch.pageX;
        prevCoords = { ...currCoords };
        currCoords = {
            x: event.touches[0].pageX,
            y: event.touches[0].pageY
        };
        scrollOffset = prevOffset + deltaX;
    }
    window.requestAnimationFrame(scrollAnimation);
});

window.addEventListener(
    "touchend",
    (event) => {
        let deltaX = (prevCoords.x - currCoords.x) / window.innerWidth;
        if (Math.abs(deltaX * maxSpeed) < 1) deltaX = 0.0;
        speed += deltaX * maxSpeed;
        if (speed > maxSpeed) speed = maxSpeed;
        else if (speed < -maxSpeed) speed = -maxSpeed;
        window.requestAnimationFrame(scrollAnimation);
    },
    false
);

function resize(event) {
    // Determine where the scrolling should end
    mapWidth = map.getBoundingClientRect().width;
    cardWidth = scrollArea.children[0].getBoundingClientRect().width;
    itemWidth = [...map.children].find(
        (item) => item.className === "map_item"
    ).getBoundingClientRect().width;
    yearWidth = [...map.children].find(
        (item) => item.className === "year"
    ).getBoundingClientRect().width;

    maxOffset = (cardWidth + cardMargin) * json.length + cardMargin - window.innerWidth;
    if (scrollOffset > maxOffset) {
        scrollOffset = maxOffset;
    }

    // Determine how much cards are on the screen
    const mapChildren = [...map.children];

    limit = window.innerWidth / (cardWidth + cardMargin) + 1;
    itemLimit = Math.floor((map.scrollWidth - yearWidth) / (itemWidth + mapItemMargin));
    windowWidth = mapWidth - yearWidth - (limit - 1) * (itemWidth + mapItemMargin);

    renderItems(json);
}

resize();

window.addEventListener("resize", resize);
