export interface InstrumentSettings {
	instrument: string;
	live: boolean;
	id?: string;
	timeFrame?: string;
	indicators?: Array<any>;
	from?: number;
	until?: number;
	bars?: Array<any>;
	focus?: boolean;
	zoom?: number;

	graphType?: string;

}

export default {};