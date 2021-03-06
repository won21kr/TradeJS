import IPC from '../ipc/IPC';

import {fork}    		from 'child_process';
import * as winston     from 'winston-color';
import Base             from '../Base';

export default class WorkerHost extends Base {

	public id: string | number;
	public _ipc: IPC;
	private _child: any = null;

	/**
	 *
	 * @param opt {Object}
	 */
	constructor(protected opt) {
		super(opt);
		this.id = this.opt.id;
		this._ipc = this.opt.ipc;
	}

	async init() {
		await super.init();
		return this._fork();
	}

	send(eventName, data?, waitForCallback?) {
		return this._ipc.send(this.id, eventName, data, waitForCallback);
	}

	async _fork() {
		return new Promise((resolve, reject) => {
			winston.info(`Creating | id=${this.id}`);

			// Merge given options
			let resolved = false,
				childArgv = JSON.stringify({
					classArguments: this.opt.classArguments || {},
					workerOptions: {
						id: this.id,
						parentId: this._ipc.id
					}
				}),

				childOpt = {
					stdio: ['pipe', process.stdout, null, 'ipc']
				};

			this._child = fork(this.opt.path, ['--no-deprecation', `--settings=${childArgv}`], childOpt);

			this._child.on('close', code => {
				winston.info(`${this.id} exited with code ${code}`);

				if (!resolved) {
					reject('Child closed before ready');
				}

				this.emit('close', code);
			});

			this._child.stderr.on('data', (data) => {
				this.emit('stderr', data.toString());

				if (data.toString().indexOf('DeprecationWarning:') === -1) {

				}
				//
				console.log(`stderr22: ${data}`);
			});

			this._child.once('message', message => {
				resolved = true;
				if (message === '__ready') {
					winston.info(`Created | id=${this.id} | pid=${this._child.pid}`);
					resolve();
				} else {
					reject('First child message must always be the __ready, received: ' + message);
				}
			});
		});
	}

	kill(code?: number) {
		this._child.kill(code);
	}
}
