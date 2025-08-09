import { Component } from '@theme/component';

/**
 * A custom element that displays a size chart with unit conversion between inches and centimeters.
 *
 * @extends {Component}
 */
class SizeChartComponent extends Component {
  constructor() {
    super();
    this.tabsContainer = null;
    this.inchesTab = null;
    this.cmTab = null;
    this.table = null;
    this.currentUnit = 'inches';
  }

  connectedCallback() {
    super.connectedCallback();
    this.initialize();
  }

  initialize() {
    this.tabsContainer = this.querySelector('.size-chart__tabs');
    this.inchesTab = this.querySelector('[data-unit="inches"]');
    this.cmTab = this.querySelector('[data-unit="cm"]');
    this.table = this.querySelector('.size-chart__table');

    if (this.tabsContainer && this.inchesTab && this.cmTab && this.table) {
      this.showTabs();
      this.bindEvents();
    }
  }

  showTabs() {
    if (this.tabsContainer) {
      /** @type {HTMLElement} */ (this.tabsContainer).style.display = 'flex';
    }
  }

  bindEvents() {
    if (this.inchesTab) {
      this.inchesTab.addEventListener('click', () => this.switchUnit('inches'));
    }
    if (this.cmTab) {
      this.cmTab.addEventListener('click', () => this.switchUnit('cm'));
    }
  }

  /**
   * @param {'inches' | 'cm'} unit
   */
  switchUnit(unit) {
    if (unit === this.currentUnit) return;

    this.currentUnit = unit;
    this.updateTabStates();
    this.updateTableContent();
  }

  updateTabStates() {
    if (this.inchesTab) {
      this.inchesTab.classList.toggle('size-chart__tab--active', this.currentUnit === 'inches');
    }
    if (this.cmTab) {
      this.cmTab.classList.toggle('size-chart__tab--active', this.currentUnit === 'cm');
    }
  }

  updateTableContent() {
    if (!this.table) return;
    
    const cells = this.table.querySelectorAll('td[data-value-inches][data-value-cm]');
    
    cells.forEach(cell => {
      const inchesValue = cell.getAttribute('data-value-inches') || '';
      const cmValue = cell.getAttribute('data-value-cm') || '';
      
      if (this.currentUnit === 'inches') {
        cell.textContent = inchesValue;
      } else {
        cell.textContent = cmValue;
      }
    });
  }
}

customElements.define('size-chart-component', SizeChartComponent);
