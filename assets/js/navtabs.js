let dynamicNavTabs = [];
let currentPage = 0;

function normalizePath(path) {
    if (!path) return '/';
    path = path.split('?')[0].split('#')[0];
    if (path.toLowerCase().endsWith('index.html')) {
        path = path.slice(0, -'index.html'.length);
    }
    if (!path.endsWith('/')) path += '/';
    if (!path.startsWith('/')) path = '/' + path;
    return path;
}

function getPageKey(path) {
    const parts = normalizePath(path).split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1].toLowerCase() : '';
}

function findCurrentPageForFilename(filename, buttonsPerPage) {
    const currentKey = getPageKey(filename);
    const index = dynamicNavTabs.findIndex(tab => getPageKey(tab.html_name) === currentKey);
    if (index === -1 || dynamicNavTabs.length <= buttonsPerPage) return 0;

    const firstPageTabs = buttonsPerPage - 1;
    if (index < firstPageTabs) return 0;

    const otherPageTabs = buttonsPerPage - 2;
    return 1 + Math.floor((index - firstPageTabs) / otherPageTabs);
}

async function loadNavigationTabs() {
    try {
        const cacheBuster = new Date().getTime();
        const response = await fetch(`/navtabs.json?v=${cacheBuster}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (response.ok) {
            dynamicNavTabs = await response.json();

            const currentPath = window.location.pathname;
            const buttonsPerPage = window.innerWidth <= 768 ? 6 : 8;
            currentPage = findCurrentPageForFilename(currentPath, buttonsPerPage);

            renderNavigation();
            console.log('Successfully loaded paginated tabs from navtabs.json');
        }
    } catch (error) {
        console.error('Error loading navigation tabs:', error);
    }
}

function getButtonWidth() {
    let availableWidth;
    if (window.innerWidth <= 768) {
        const mainContainer = document.querySelector('.main-container');
        const containerWidth = mainContainer ? mainContainer.offsetWidth : window.innerWidth - 30;
        const totalMargins = 5 * 2;
        return (containerWidth - totalMargins) / 6;
    } else {
        availableWidth = window.innerWidth - 40;
        const totalMargins = 7 * 2;
        return (availableWidth - totalMargins) / 8;
    }
}

function renderNavigation() {
    const wrapper = document.getElementById('navWrapper');
    if (!wrapper) return;

    const buttonWidth = getButtonWidth();
    const buttonsPerPage = window.innerWidth <= 768 ? 6 : 8;

    const currentKey = getPageKey(window.location.pathname);

    wrapper.innerHTML = '';
    let buttons = [];

    if (dynamicNavTabs.length <= buttonsPerPage) {
        buttons = dynamicNavTabs.map(tab => ({ type: 'tab', data: tab }));
    } else {
        if (currentPage === 0) {
            for (let i = 0; i < buttonsPerPage - 1 && i < dynamicNavTabs.length; i++) {
                buttons.push({ type: 'tab', data: dynamicNavTabs[i] });
            }
            buttons.push({ type: 'next' });
        } else {
            const firstPageTabs = buttonsPerPage - 1;
            const otherPageTabs = buttonsPerPage - 2;
            const startIndex = firstPageTabs + (currentPage - 1) * otherPageTabs;

            const remainingTabs = dynamicNavTabs.length - startIndex;
            const isLastPage = remainingTabs <= buttonsPerPage - 1;

            if (isLastPage) {
                buttons.push({ type: 'prev' });
                for (let i = startIndex; i < dynamicNavTabs.length; i++) {
                    buttons.push({ type: 'tab', data: dynamicNavTabs[i] });
                }
            } else {
                buttons.push({ type: 'prev' });
                for (let i = startIndex; i < startIndex + otherPageTabs && i < dynamicNavTabs.length; i++) {
                    buttons.push({ type: 'tab', data: dynamicNavTabs[i] });
                }
                buttons.push({ type: 'next' });
            }
        }
    }

    buttons.forEach(button => {
        const btn = document.createElement('a');
        btn.className = 'nav-button';
        btn.style.width = buttonWidth + 'px';

        if (button.type === 'prev') {
            btn.classList.add('nav-arrow');
            btn.innerHTML = `
                <span class="nav-button-text">Previous</span>
                <img src="/assets/buttons/next_arrow.png" alt="←" style="transform: scaleX(-1);" class="nav-button-icon">
            `;
            btn.onclick = (e) => {
                e.preventDefault();
                if (currentPage > 0) {
                    currentPage--;
                    renderNavigation();
                }
            };
        } else if (button.type === 'next') {
            btn.classList.add('nav-arrow');
            btn.innerHTML = `
                <span class="nav-button-text">Next</span>
                <img src="/assets/buttons/next_arrow.png" alt="→" class="nav-button-icon">
            `;
            btn.onclick = (e) => {
                e.preventDefault();
                currentPage++;
                renderNavigation();
            };
        } else {
            btn.href = button.data.html_name;
            btn.innerHTML = `
                <span class="nav-button-text">${button.data.name}</span>
                <img src="${button.data.logo}" alt="${button.data.name}" class="nav-button-icon">
            `;
            if (getPageKey(button.data.html_name) === currentKey) {
                btn.classList.add('active');
            }
        }
        wrapper.appendChild(btn);
    });

    initializeNavButtonEffects();
}

function initializeNavButtonEffects() {
    document.querySelectorAll('.nav-button').forEach(button => {
        button.onmousedown = function() { this.classList.add('pressed'); };
        button.onmouseup = function() { this.classList.remove('pressed'); };
        button.onmouseleave = function() { this.classList.remove('pressed'); };
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadNavigationTabs();

    window.addEventListener('resize', function() {
        if (dynamicNavTabs.length > 0) {
            renderNavigation();
        }
    });
});