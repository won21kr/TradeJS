import { Injectable } from '@angular/core';
import * as io from "socket.io-client";

@Injectable()
export default class SocketService {

    socket: any;
    //
    constructor() {}
    //
    init() {
        this.socket = io('localhost:3000');
    }
}