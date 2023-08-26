const apiUrl = 'https://algorithms.design/api/v1/item?id=6304bbde7a4071611257d45e';

/** Globals for optimization */
let firstYear = null;
let cardList = null;
let cellList = null;
let yearWidth = null;
let yearMargin = null;
let cardRect = null;
let cellRect = null;
let cardStyle = null;
let cardMargin = null;
let cardListRect = null;
let cellStyle = null;
let cellMargin = null;
let cellListRect = null;
let loadFromApi = false;
let cellContainer = null;
let grid = null;
let backButton = null
let cardListOffset = null;

let items = [];

document.addEventListener("DOMContentLoaded", _ => {
    cellContainer = document.querySelector('.cells-container');
    firstYear = document.querySelector('.first-year');
    cardList = document.querySelector('.cards');
    cellList = document.querySelector('.cells');
    grid = document.querySelector('.grid');
    grid.appendChild(document.querySelector('.timeline__category-h1'));
    // Turn off loading indicator
    const center = document.querySelector('.center');
    center.style.display = 'none';
    grid.style.display = 'grid';
    backButton = document.querySelector('.navbar__back-btn')
    backButton.addEventListener('click', () => {
        cellList.children[0].click();
    });
    
    grid.appendChild(cellContainer);
    
    if (loadFromApi) {
        loadItems(items).then(function () {
            // Preprocess items
            for (let i = 0, years = 0, current = items[0].year; i < items.length; i++) {
                if (items[i].year !== current) {
                    current = items[i].year;
                    years++;
                }
                items[i].years = years;
            }

            // Initialize rendering
            horizontalWheel();
            populateLists();

            cardList.addEventListener('scroll', _ => {
                tintCells();
                setCurrentYear();
            });

            function onResize() {
                yearWidth = firstYear.getBoundingClientRect().width;
                yearMargin = parseFloat(window.getComputedStyle(firstYear).marginLeft);
                cardRect = cardList.children[0].getBoundingClientRect();
                cellRect = cellList.children[0].getBoundingClientRect();
                cardStyle = window.getComputedStyle(cardList.children[0]);
                cardMargin = parseFloat(cardStyle.marginLeft);
                cardListRect = cardList.getBoundingClientRect();
                cellStyle = window.getComputedStyle(cellList.children[0]);
                cellMargin = parseFloat(cellStyle.marginLeft);
                cellListRect = cellList.getBoundingClientRect();
                tintCells();
                firstYear.textContent = items[0].year;
                firstYear.onclick = e => scrollFunction(cardList.children[0], cellList.children[0], e);
            }

            window.addEventListener('resize', onResize);
            onResize();
        });
    } else {
        window.fsAttributes = window.fsAttributes || [];
        window.fsAttributes.push(['cmsload', (listInstances) => {
                const [listInstance] = listInstances;

                window.fsAttributes.cmsload.loading.then(function (finalResult) {
                    items.push(...listInstance.items);
                    prepareCMSLoadItems(items);
                });
        },
        ]);
    }
});


function prepareCMSLoadItems(items) {
    items.forEach((item) => {
        item.year = item.element.getAttribute('year');
        item.sorting = item.element.getAttribute('sorting');
        item.hype = item.element.getAttribute('hype');
    });

    // Sort items by year
    items.sort((a, b) => b.year - a.year);

    // Calculate maximum sorting
    let maxSorting = +items[0].hype;
    for (const item of items) {
        if (+item.hype > +maxSorting) {
            maxSorting = +item.hype;
        }
    }

    // Normalize sort
    for (const item of items) {
        item.height = (+item.hype + 1) / (+maxSorting + 1);
    }

    for (let i = 0, years = 0, current = items[0].year; i < items.length; i++) {
        if (items[i].year !== current) {
            current = items[i].year;
            years++;
        }
        items[i].years = years;
    }

    // Initialize rendering
    horizontalWheel();
    populateCMSLoadLists();

    // Turn off loading indicator
    const center = document.querySelector('.center');
    center.style.display = 'none';
    grid.style.display = 'grid';

    cardList.addEventListener('scroll', _ => {
        tintCells();
        setCurrentYear();
    });

    function onResize() {
        yearWidth = firstYear.getBoundingClientRect().width;
        yearMargin = parseFloat(window.getComputedStyle(firstYear).marginLeft);
        cardRect = cardList.children[0].getBoundingClientRect();
        cellRect = cellList.children[0].getBoundingClientRect();
        cardStyle = window.getComputedStyle(cardList.children[0]);
        cardMargin = parseFloat(cardStyle.marginLeft);
        cardListRect = cardList.getBoundingClientRect();
        cellStyle = window.getComputedStyle(cellList.children[0]);
        cellMargin = parseFloat(cellStyle.marginLeft);
        cellListRect = cellList.getBoundingClientRect();
        tintCells();
        firstYear.textContent = items[0].year;
        firstYear.onclick = e => scrollFunction(cardList.children[0], cellList.children[0], e);
    }

    window.addEventListener('resize', onResize);
    onResize();
}

function populateCMSLoadLists() {
    for (let i = 0, current = items[0].year; i < items.length; i++) {
        const card = items[i].element;
        card.className = 'card';
        card.id = `card-${i}`;
        card.classList.add(getBackgroundClass(items[i].height));

        card.innerHTML = items[i].element.innerHTML;

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${i}`;
        cell.style.setProperty('--height', `${items[i].height * 100}%`);

        if (current !== items[i].year) {
            current = items[i].year;
            const year = document.createElement('div');
            year.className = 'year';
            year.id = `year-${i}`;
            year.textContent = `${current}`;
            year.onclick = e => scrollFunction(card, cell, e);
            cellList.appendChild(year);
        }

        cardList.appendChild(card);
        cellList.appendChild(cell);
        cell.onclick = e => scrollFunction(card, cell, e);
    }
}

function getBackgroundClass(hype) {
    var backgroundClass = '';
    hype = hype * 100;

    if (hype < 20)
        backgroundClass = 'turquoise';
    else if (hype < 40)
        backgroundClass = 'green';
    else if (hype < 60)
        backgroundClass = 'pink';
    else if (hype < 80)
        backgroundClass = 'orange';
    else
        backgroundClass = 'red';
    return backgroundClass;
}

function horizontalWheel() {
    /** Max `scrollLeft` value */
    let scrollWidth = 0;

    /** Target left value */
    let targetLeft = 0;
    let yearLeft = 0;
    let lastLeft = 0;
    let firstLeft = 0;

    /** Touch input variables */
    let startX = 0;
    let currentX = 0;
    let previousX = 0;
    let touchStart = 0;

    /** Dragging variable */
    let dragging = false;

    /** Momentum scrolling speed */
    let scrollSpeed = 0;
    let lastOffset = 0;

    function yearsScroll(yearsOffset, coef) {
        if (yearsOffset !== lastOffset) {
            if (lastLeft === cellList.scrollLeft) {
                lastOffset = yearsOffset;
                firstLeft = 0;
                firstYear.style.setProperty('--left', `${firstLeft}px`);
                setCurrentYear();
                return false;
            }

            lastLeft = cellList.scrollLeft;
            yearLeft = (cardList.scrollLeft + scrollSpeed) * coef + yearsOffset + 4;
            const currentLeft = cellList.scrollLeft + (lastOffset > yearsOffset ? -5 : 5);
            cellList.scrollTo({
                top: 0,
                left: currentLeft
            });

            if (lastOffset < yearsOffset) {
                firstLeft -= 5;
                firstYear.style.setProperty('--left', `${firstLeft}px`);
            }

            if ((currentLeft >= yearLeft && lastOffset < yearsOffset) ||
                (currentLeft <= yearLeft && lastOffset > yearsOffset)) {
                lastOffset = yearsOffset;
                firstLeft = 0;
                firstYear.style.setProperty('--left', `${firstLeft}px`);
                setCurrentYear();
                return false;
            }

            requestAnimationFrame(momentumScroll);
            return false;
        }
        return true;
    }

    function instantScroll() {
        const coef = getScale();
        const yearsOffset = getYearsOffset();
        if (!yearsScroll(yearsOffset, coef))
            return;

        // Performing horizontal scroll
        cardList.scrollTo({
            top: 0,
            left: targetLeft
        });
        cellList.scrollTo({
            top: 0,
            left: cardList.scrollLeft * coef + yearsOffset
        });
    }

    function momentumScroll() {
        const coef = getScale();
        const yearsOffset = getYearsOffset();
        if (!yearsScroll(yearsOffset, coef))
            return;

        // Performing horizontal scroll
        cardList.scrollTo({
            top: 0,
            left: cardList.scrollLeft + scrollSpeed
        });
        cellList.scrollTo({
            top: 0,
            left: (cardList.scrollLeft + scrollSpeed) * coef + yearsOffset
        });

        // Decelerate
        scrollSpeed /= 1.1;
        if (Math.abs(scrollSpeed) < 1)
            return;

        // Break if already stopped
        if (cardList.scrollLeft === 0 || cardList.scrollLeft === scrollWidth)
            return;

        requestAnimationFrame(momentumScroll);
    }

    function onWheel(e) {
        e.preventDefault();
        scrollWidth = cardList.scrollWidth - cardList.clientWidth;
        scrollSpeed = e.deltaY / 5;
        requestAnimationFrame(momentumScroll);
    }

    function onTouchStart(e) {
        e.preventDefault();
        startX = e.touches[0].pageX;
        touchStart = cardList.scrollLeft;
    }

    function onTouchMove(e) {
        e.preventDefault();
        previousX = currentX;
        onDragMove(e);
        const offsetX = startX - currentX;
        targetLeft = Math.min(scrollWidth, Math.max(0, touchStart + offsetX));
        requestAnimationFrame(instantScroll);
    }

    function onTouchEnd(e) {
        e.preventDefault();
        const deltaX = (previousX - currentX) / window.innerWidth * 250;
        previousX = currentX;
        scrollSpeed = deltaX;
        requestAnimationFrame(momentumScroll);
    }

    function onMouseDragStart(e) {
        e.preventDefault();
        if (e.target.className === 'cells') {
            startX = e.pageX;
            touchStart = cardList.scrollLeft;
            dragging = true;
        }
    }

    function onMouseDragMove(e) {
        e.preventDefault();
        if (dragging) {
            const coef = getScale();
            previousX = currentX;
            currentX = e.pageX;
            const offsetX = startX - currentX;
            scrollWidth = cardList.scrollWidth - cardList.clientWidth;
            targetLeft = Math.min(scrollWidth, Math.max(0, touchStart + offsetX / coef));
            requestAnimationFrame(instantScroll);
        }
    }

    function onMouseDragEnd(e) {
        e.preventDefault();
        if (dragging) {
            onDragEnd();
        } else if (e.target && e.target.onclick) {
            e.target.onclick();
        }
    }

    function onTouchDragStart(e) {
        e.preventDefault();
        if (e.touches[0].target.className === 'cells') {
            startX = e.touches[0].pageX;
            touchStart = cardList.scrollLeft;
            dragging = true;
        } else if (e.touches[0].target && e.touches[0].target.onclick) {
            e.touches[0].target.onclick();
        }
    }

    function onTouchDragMove(e) {
        e.preventDefault();
        if (dragging) {
            const coef = getScale();
            previousX = currentX;
            onDragMove(e);
            const offsetX = startX - currentX;
            targetLeft = Math.min(scrollWidth, Math.max(0, touchStart + offsetX / coef));
            requestAnimationFrame(instantScroll);
        }
    }

    function onTouchDragEnd(e) {
        e.preventDefault();
        if (dragging)
            onDragEnd();
    }

    function onDragMove(e) {
        currentX = e.touches[0].pageX;
        scrollWidth = cardList.scrollWidth - cardList.clientWidth;
    }

    function onDragEnd() {
        const coef = getScale();
        const deltaX = (previousX - currentX) / window.innerWidth * 250;
        previousX = currentX;
        scrollSpeed = deltaX / coef;
        dragging = false;
        requestAnimationFrame(momentumScroll);
    }

    cardList.addEventListener('wheel', onWheel);
    cellList.addEventListener('wheel', onWheel);

    cardList.addEventListener('touchstart', onTouchStart, false);
    cardList.addEventListener('touchmove', onTouchMove, false);
    cardList.addEventListener('touchend', onTouchEnd, false);

    cellList.addEventListener('touchstart', onTouchDragStart, false);
    cellList.addEventListener('touchmove', onTouchDragMove, false);
    cellList.addEventListener('touchend', onTouchDragEnd, false);

    cellList.addEventListener('mousedown', onMouseDragStart);
    cellList.addEventListener('mousemove', onMouseDragMove);
    cellList.addEventListener('mouseup', onMouseDragEnd);
    cellList.addEventListener('mouseleave', () => dragging = false);
}

async function loadItems(items) {
    let jsonOffset = 0;
    let total = 0;

    // Fetch first 100 items and get the total items number
    let response = await fetch(`${apiUrl}&offset=${jsonOffset}&limit=100`);
    response = await response.json();
    total = response.total;
    items.push(...response.items);

    // Fetch the rest of items
    for (jsonOffset = 100; jsonOffset < total; jsonOffset += 100) {
        response = await fetch(`${apiUrl}&offset=${jsonOffset}&limit=100`);
        response = await response.json();
        items.push(...response.items);
    }

    // Sort items by year
    items.sort((a, b) => b.year - a.year);

    // Calculate maximum sorting
    let maxSorting = items[0].sorting;
    for (const item of items) {
        if (item.sorting > maxSorting) {
            maxSorting = item.sorting;
        }
    }

    // Normalize sort
    for (const item of items) {
        item.height = (item.sorting + 1) / (maxSorting + 1);
    }
  
  // for (let i = 0; i < 10; i++) {
  //   items.push({height: 1, year: 2023});
  // }
  // for (let i = 0; i < 10; i++) {
  //   items.push({height: 1, year: 2022});
  // }
  // for (let i = 0; i < 10; i++) {
  //   items.push({height: 1, year: 2021});
  // }
}

function populateLists() {
    for (let i = 0, current = items[0].year; i < items.length; i++) {
        const card = document.createElement('div');
        const div = document.createElement('div');
        card.className = 'card';
        card.id = `card-${i}`;

        if (items[i].thumbnail) {
          const image = document.createElement('img');
          image.src = items[i].thumbnail?.url ?? '';
          image.alt = items[i].thumbnail?.alt ?? '';
          div.appendChild(image);
        }
        const header = document.createElement('h1');
        header.textContent = items[i].name;
        const link = document.createElement('a');
        link.href = items[i] ? items[i]['external-url'] ?? '' : '';
        link.textContent = 'Read more';

        div.appendChild(header);
        div.innerHTML += items[i].short ?? '';
        div.appendChild(link);
        card.appendChild(div);

        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${i}`;
        cell.style.setProperty('--height', items[i].height);

        if (current !== items[i].year) {
            current = items[i].year;
            const year = document.createElement('div');
            year.className = 'year';
            year.id = `year-${i}`;
            year.textContent = `${current}`;
            year.onclick = e => scrollFunction(card, cell, e);
            cellList.appendChild(year);
        }

        cardList.appendChild(card);
        cellList.appendChild(cell);
        cell.onclick = e => scrollFunction(card, cell, e);
    }
}

function scrollFunction(card, cell) {
    cardList.scrollTo({
        top: 0,
        left: card.offsetLeft - cardListRect.left - cardMargin,
        behavior: 'smooth'
    });
    cellList.scrollTo({
        top: 0,
        left: cell.offsetLeft - cardMargin - cellMargin - yearWidth + yearMargin * 2,
        behavior: 'smooth'
    });
}

function getVisibleCards() {
    const cardsInScreen = Math.ceil(cardList.clientWidth / (cardRect.width + cardMargin)) + 1;
    const firstIndex = Math.floor(cardList.scrollLeft / (cardRect.width + cardMargin));
    const lastIndex = firstIndex + cardsInScreen > cardList.children.length ?
                        cardList.children.length :
                        firstIndex + cardsInScreen;

    const cards = [];
    for (let i = firstIndex; i < lastIndex; i++)
        cards.push(cardList.children[i]);

    return cards;
}

function getVisibleCells(years, all) {
    const cellsInScreen = Math.ceil((cellList.clientWidth - yearWidth) / (cellRect.width + cellMargin));
    const firstVisibleCard = getVisibleCards()[0];
    const firstCellId = Number(firstVisibleCard.id.replace('card-', ''));
    const yearsOffset = (yearWidth + yearMargin) * (items[Math.floor(firstCellId)].years);
    const coef = getScale();
  
    let firstIndex = Math.floor((cellList.scrollLeft - yearsOffset) / (cellRect.width + cellMargin)) + items[firstCellId].years;
    if (all) {
      if (cardList.scrollLeft * coef < cellList.scrollWidth - cellList.clientWidth)
        firstIndex -= 4;
      if (firstIndex < 0)
        firstIndex = 0;
    }
    if (firstIndex > cellList.children.length - 1) firstIndex = cellList.children.length - 1;
    const lastIndex = firstIndex + cellsInScreen > cellList.children.length ?
                                cellList.children.length :
                                firstIndex + cellsInScreen;

    const cells = [];
    for (let i = firstIndex; i < lastIndex; i++)
        if (cellList.children[i]?.className === (years ? 'year' : 'cell'))
            cells.push(cellList.children[i]);

    return cells;
}

function tintCells() {
    const visibleCards = getVisibleCards();
    const visibleCells = getVisibleCells(false, true);
    const visibleYears = getVisibleCells(true);

    for (const cell of visibleCells) {
        cell.style.setProperty('--left-width', '100%');
        cell.style.setProperty('--right-width', '0');
    }

    for (const year of visibleYears) {
      year.style.background = '#000';
    }

    for (const card of visibleCards) {
        const rect = card.getBoundingClientRect();
        const cell = document.querySelector('#' + card.id.replace('card', 'cell'));
        const coef = cellRect.width / rect.width;

        const leftOverlay = rect.left < cardListRect.left ? -(rect.left - cardListRect.left) * coef : 0;
        if (leftOverlay > 0 && leftOverlay < cellRect.width) {
            const id = Number(card.id.replace('card-', ''));
            const year = document.querySelector(`#year-${id+1}`);
            if (year) year.style.background = '#fff';
        }
        cell.style.setProperty('--left-width', leftOverlay > cellRect.width ? `${cellRect.width}px` : `${leftOverlay}px`);
        const rightOverlay = rect.right > cardListRect.right ? (rect.right - cardListRect.right) * coef : 0;
        if ((leftOverlay === 0 && rightOverlay === 0) || (rightOverlay > 0 && rightOverlay < cellRect.width)) {
            const year = document.querySelector('#' + card.id.replace('card', 'year'));
            if (year) year.style.background = '#fff';
        }
        cell.style.setProperty('--right-width', rightOverlay > cellRect.width ? `${cellRect.width}px` : `${rightOverlay}px`);
    }
}

function setCurrentYear() {
    const firstVisibleCell = getVisibleCells()[0];
    const firstCellId = Number(firstVisibleCell.id.replace('cell-', ''));
    const firstYearId = items.findIndex(e => e.year === items[firstCellId].year);
    const firstCard = document.querySelector(`#card-${firstYearId}`);
    const firstCell = document.querySelector(`#cell-${firstYearId}`);
    if (firstCellId > 0) {
        firstYear.textContent = items[firstCellId].year;
        firstYear.onclick = e => scrollFunction(firstCard, firstCell, e);
    }
}

function getScale() {
    return (cellRect.width + cellMargin) / (cardRect.width + cardMargin);
}

function getYearsOffset() {
    const firstVisibleCard = getVisibleCards()[0];
    const firstCellId = Number(firstVisibleCard.id.replace('card-', ''));
    return (yearWidth + yearMargin) * (items[Math.floor(firstCellId)].years);
}