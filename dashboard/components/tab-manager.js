export class TabManager {
    constructor(container, tabsConfig) {
        this.container = container;
        this.tabsConfig = tabsConfig;
        this.activeTabId = tabsConfig[0].id;
        this.onTabChange = null;
        this.render();
    }

    render() {
        this.container.innerHTML = '';

        // Nav
        const nav = document.createElement('div');
        nav.className = 'tabs-nav';

        this.tabsConfig.forEach(tab => {
            const btn = document.createElement('button');
            btn.className = `tab-btn ${tab.id === this.activeTabId ? 'active' : ''}`;
            btn.textContent = tab.label;
            btn.dataset.target = `tab-content-${tab.id}`;
            
            btn.addEventListener('click', () => {
                this.setActiveTab(tab.id);
            });
            
            nav.appendChild(btn);
        });

        this.container.appendChild(nav);

        // Content areas
        this.tabsConfig.forEach(tab => {
            const content = document.createElement('div');
            content.id = `tab-content-${tab.id}`;
            content.className = `tab-content ${tab.id === this.activeTabId ? 'active' : ''}`;
            this.container.appendChild(content);
        });
    }

    setActiveTab(tabId) {
        if (this.activeTabId === tabId) return;
        this.activeTabId = tabId;

        // Update nav
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === `tab-content-${tabId}`);
        });

        // Update content
        this.container.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-content-${tabId}`);
        });

        if (this.onTabChange) {
            this.onTabChange(tabId);
        }
    }

    getContentContainer(tabId) {
        return this.container.querySelector(`#tab-content-${tabId}`);
    }
}
