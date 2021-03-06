import * as path        from 'path';
import InstrumentCache  from './InstrumentCache';
import * as winston		from 'winston-color';

const PATH_INDICATORS = path.join(__dirname, '../../../shared/indicators');

export default class Instrument extends InstrumentCache {

	private _unique = 0;

	indicators = [];

	async init() {
		await super.init();
		await this._setIPCEvents();

		await this.loadTemplate('default');
	}

	async tick(timestamp, bid, ask): Promise<void> {
		this.indicators.forEach(i => i.onTick(bid, ask));
	}

	toggleTimeFrame(timeFrame: string) {
		this.timeFrame = timeFrame;

		return this.reset();
	}

	async loadTemplate(template: string) {

	}

	addIndicator(name, options): any {
		winston.info('add indicator: ' + name);

		let indicator = null,
			id = null;

		options.name = name;

		try {
			id = name + '_' + ++this._unique;
			let indicatorPath = path.join(PATH_INDICATORS, name, 'index.js');
			indicator = new (require(indicatorPath).default)(this.ticks, options);
			indicator.id = id;
			this.indicators.push(indicator);

			indicator._doCatchUp();
		} catch (err) {
			console.log('Could not add indicator', err);
		}

		return indicator;
	}

	removeIndicator(id) {
		winston.info('remove indicator: ' + id);
		this.indicators.splice(this.indicators.findIndex(indicator => indicator.id === id), 1);
	}

	removeAllIndicators() {
		winston.info('remove all indicator: ');
		this.indicators = [];
	}

	getIndicatorData(id: string, count?: number, shift?: number) {
		let _indicator = this.indicators.find(indicator => indicator.id === id);

		if (!_indicator) {
			throw new Error(`Indicator [${id}] does not exists`);
		}

		return _indicator.getDrawBuffersData(count, shift);
	}

	getIndicatorsData(count: number, shift?: number) {
		return this.indicators.map(indicator => {
			return {
				id: indicator.id,
				data: this.getIndicatorData(indicator.id, count, shift)
			}
		});
	}

	async _setIPCEvents() {
		this._ipc.on('read', async (data, cb: Function) => {

			try {
				let returnObj = <any>{
					candles: await this.read(data.count, data.offset, data.from, data.until)
				};

				if (data.indicators) {
					returnObj.indicators = await this.getIndicatorsData(data.count, data.offset)
				}

				cb(null, returnObj);
			} catch (error) {
				console.log('Error:', error);
				cb(error);
			}
		});

		this._ipc.on('get-data', async (data: any, cb: Function) => {
			try {
				if (typeof data.indicatorId !== 'undefined') {
					cb(null, await this.getIndicatorData(data.indicatorId, data.count, data.shift));
				} else {
					cb(null, await this.getIndicatorsData(data.count, data.shift));
				}

			} catch (error) {
				console.log('Error:', error);
				cb(error);
			}
		});

		this._ipc.on('indicator:add', async (data: any, cb: Function) => {
			try {
				cb(null, (await this.addIndicator(data.name, data.options)).id);
			} catch (error) {
				console.log('Error:', error);
				cb(error);
			}
		});

		this._ipc.on('toggleTimeFrame', async (data: any, cb: Function) => {
			try {
				cb(null, await this.toggleTimeFrame(data.timeFrame));
			} catch (error) {
				console.log('Error:', error);
				cb(error);
			}
		});
	}

	async reset(keepIndicators = true) {
		let indicators = [];

		for (let id in this.indicators) {
			indicators.push(this.indicators[id].options);
		}

		this.removeAllIndicators();

		await super.reset();

		for (let i = 0; i < indicators.length; ++i) {
			this.addIndicator(indicators[i].name, indicators[i]);
		}
	}
}