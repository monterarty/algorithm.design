const overviewItems = document.querySelectorAll('.overview__item');
const overviewWrapper = document.querySelector('.overview__wrapper');
const timelines = document.querySelectorAll('.overview__timeline');
var yearsTimlineWidth = document.querySelector('.overview__timeline.is--years').clientWidth;
var allDays = null;
var years = [];
var minYear = null;
var maxYear = null;
var currentYear = null;
 /** Momentum scrolling speed */
let scrollSpeed = 0;
let lastOffset = 0;
let scrollWidth = 0;


for (var i = 0; i < overviewItems.length; i++) {
    years.push(overviewItems[i].getAttribute('year'));
}

years = [...new Set(years)];
years.forEach(year => {
    const div = document.createElement('div');
    div.textContent = year;
    div.setAttribute('year', year);
    div.id = `yearsTimeline-${year}`;
    div.classList.add('overview__year-item');
    document.querySelector('.overview__timeline.is--years').appendChild(div);
})

minYear = Math.min(...years);
maxYear = Math.max(...years);
currentYear = maxYear;

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInYear(year) {
    return isLeapYear(year) ? 366 : 365;
}

function getAllDatesInYear(year) {
    const daysInYear = getDaysInYear(year);
    const allDates = [];

    for (let day = 1; day <= daysInYear; day++) {
        const date = new Date(year, 0, day);
        allDates.push(date);
    }

    return allDates;
}

for (var i = 0; i < timelines.length - 1; i++) {
    const timelineInitChildrens = timelines[i].children;
    for (var yearToDisplay = maxYear; yearToDisplay >= minYear; yearToDisplay--) {
        const allDates = getAllDatesInYear(yearToDisplay);
        for (const date of allDates) {
            const currentDate = new Date(date);
            const formatedDate = `${currentDate.getDate()}/${currentDate.getMonth()+1}/${currentDate.getFullYear()}`;
            const div = document.createElement('div');
            div.id = `item-${i}-${formatedDate}`;
            div.classList.add('overview__day-item');
            div.setAttribute('date', formatedDate);
            div.setAttribute('year', currentDate.getFullYear());
            timelines[i].appendChild(div);
        }
    }
    const timelineChildren = Array.prototype.slice.call(timelines[i].children);
    timelineChildren.forEach((children) => {
        if (children.classList.contains('overview__item')) {
            const childrenItemDate = children.getAttribute('date');
            document.getElementById(`item-${i}-${childrenItemDate}`)?.appendChild(children);
        }
    })
}

allDays = document.querySelectorAll('.is--reference .overview__day-item');
allDays.forEach(dayItem => {
    const allDaysInTimeline = document.querySelectorAll('[date="' + dayItem.getAttribute('date') + '"]');
    var isDelete = 1;
    allDaysInTimeline.forEach(currentDayItem => {
        if (currentDayItem.hasChildNodes()) {
            isDelete = 0
        }
    })

    if (isDelete) {
        allDaysInTimeline.forEach(currentDayItem => {
            currentDayItem.remove();
        })
    }
});

function setYearsTimeline() {
    allDays = document.querySelectorAll('.is--reference .overview__day-item');
    document.getElementById('yearsTimeline-' + maxYear).classList.add('is--active');
    document.querySelectorAll('.overview__item-wrapper').forEach(element => {
        element.style.width = document.querySelector('.overview__timeline').scrollWidth + 'px';
    });
    yearsTimlineWidth = document.querySelector('.overview__timeline.is--years').scrollWidth;
    document.querySelector('.overview__frame-wrapper').style.width = yearsTimlineWidth + 'px';
    allDays.forEach(dayItem => {
        const itemYear = +dayItem.getAttribute('year');
            
        if (currentYear !== itemYear) {
            if (yearsTimlineWidth - dayItem.offsetLeft < 100) {
                document.getElementById('yearsTimeline-' + itemYear).style.right = 0;
                document.getElementById('yearsTimeline-' + itemYear).style.left = 'auto';
                document.getElementById('yearsTimeline-' + minYear).classList.add('is--active');
            } else {
                document.getElementById('yearsTimeline-' + itemYear).style.left = dayItem.offsetLeft + 'px';
                document.getElementById('yearsTimeline-' + itemYear).classList.add('is--active');

            }
            currentYear = itemYear;
        }
    })
}

setYearsTimeline();
window.addEventListener('resize', setYearsTimeline);

function getBackgroundClass(hype) {
    var backgroundClass = '';
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
            
function momentumScroll() {
        overviewWrapper.scrollTo({
            top: 0,
            left: overviewWrapper.scrollLeft + scrollSpeed
        });
        
        // Decelerate
        scrollSpeed /= 1.1;
        if (Math.abs(scrollSpeed) < 1)
            return;

        // Break if already stopped
        if (overviewWrapper.scrollLeft === 0 || overviewWrapper.scrollLeft === scrollWidth)
            return;

        requestAnimationFrame(momentumScroll);
    }

    function onWheel(e) {
        e.preventDefault();
        scrollWidth = overviewWrapper.scrollWidth - overviewWrapper.clientWidth;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            scrollSpeed = e.deltaY / 10;
        } else {
            scrollSpeed = e.deltaX / 10;
        }
        requestAnimationFrame(momentumScroll);
    }

overviewWrapper.addEventListener('wheel', onWheel);
overviewWrapper.addEventListener('wheel', onWheel);
    
$(document).on('click', '.overview__item', function () {
    const data = {
        "hype": +$(this).attr('hype') + 1,
        "slug": $(this).attr('slug')
    }
    $.ajax({
        url: 'https://algorithms.design/api/v1/collections/6304bbde7a4071611257d45e',
        dataType: 'application/json',
        method: 'PUT',
        data: JSON.stringify(data),
        success: function (response) {
            console.log(response);
        }
    })
})

const items = document.querySelectorAll('.overview__item');
var maxHype = 0;
for (const item of items) {
    const hype = item.getAttribute('hype');
    if (+hype > +maxHype) {
        maxHype = +hype;
    }
}

items.forEach((item) => {
    var hype = item.getAttribute('hype');
    hype = (+hype + 1) / (+maxHype + 1) * 100;
    item.classList.add(getBackgroundClass(hype));
    item.querySelector('.overview__item-figure').style.height = `${hype}%`;

    item.querySelector('.overview__item-figure-wrap').addEventListener('mouseenter', () => {
        const itemTitle = item.getAttribute('title');
        const elementTitle = item.closest('.overview__item-wrapper').querySelector('.overview__item-title')

        elementTitle.textContent = itemTitle;
        elementTitle.style.opacity = 1;
    })
    item.querySelector('.overview__item-figure-wrap').addEventListener('mouseleave', () => {
        const elementTitle = item.closest('.overview__item-wrapper').querySelector('.overview__item-title')

        elementTitle.style.opacity = 0;
    })
});
