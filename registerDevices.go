package main

import (
	"encoding/json"

	"golang.org/x/crypto/ssh"
)

var devices = make(map[string]*Device)

type Device struct {
	Uuid    string
	Name    string
	Actions []string
	Sensors map[string]*Sensor
	channel ssh.Channel
}

func (d *Device) Action(name string, data string) {
	js, _ := json.Marshal(map[string]string{
		"action": name,
		"data":   data,
	})
	d.channel.Write(js)
}

func (d *Device) SetOffline() {
	d.channel = nil
}

func (d *Device) AddReading(sensor string, data interface{}) {
	if s, ok := d.Sensors[sensor]; ok {
		d.Sensors[sensor].Readings = append(s.Readings, data)
	}
}

type Sensor struct {
	Name     string
	Readings []interface{}
}

func GetOrCreateDevice(uuid string) *Device {
	if d, ok := devices[uuid]; ok {
		return d
	}
	return &Device{Uuid: uuid}
}

func GetDevice(uuid string) *Device {
	return devices[uuid]
}

func (d *Device) Save() {
	devices[d.Uuid] = d
}
