package main

import (
	"encoding/json"
	"log"

	"golang.org/x/crypto/ssh"
)

var devices = make(map[string]*Device)

type Device struct {
	Uuid    string
	Name    string
	Actions []string
	Sensors map[string]*Sensor
	channel ssh.Channel `json:"-"`
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

func (d *Device) AddReading(sensor string, data string) {
	if s, ok := d.Sensors[sensor]; ok {
		s.Readings = append(s.Readings, data)
	} else {
		d.Sensors[sensor] = &Sensor{Name: sensor, Readings: []string{data}}
	}

	// broadcast the new reading
	log.Println("Broadcasting...")
	ioServer.BroadcastTo("authorised", "sensor_reading", d.Uuid, sensor, data)
}

func (d *Device) PushToWeb() {
	log.Println("Pushing to web!")
	ioServer.BroadcastTo("authorised", "device_data", map[string]interface{}{
		"uuid":    d.Uuid,
		"name":    d.Name,
		"actions": d.Actions,
		"sensors": d.Sensors,
	})
}

type Sensor struct {
	Name     string
	Readings []string
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
