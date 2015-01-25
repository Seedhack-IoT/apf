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

func (d *Device) Action(name string) {
	js, _ := json.Marshal(map[string]string{
		"action": name,
	})
	d.channel.Write(js)
}

func (d *Device) SetOffline() {
	d.channel = nil
	d.Disconnected()
}

func (d *Device) AddReading(sensor string, data string) {
	if s, ok := d.Sensors[sensor]; ok {
		s.Readings = append(s.Readings, data)
		s.checkConditionals(data)
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
		"active":  d.channel != nil,
	})
}

func (d *Device) Disconnected() {
	ioServer.BroadcastTo("authorised", "device_offline", d.Uuid)
}

type cond struct {
	value    string
	actuator string
	action   string
}

type Sensor struct {
	Name     string
	Readings []string

	conditional []*cond `json:"-"`
}

func (s *Sensor) checkConditionals(newval string) {
	for _, c := range s.conditional {
		if c.value == newval {
			a := GetDevice(c.actuator)
			if a == nil {
				log.Printf("Conditional action fired but actuator %s not found.", c.actuator)
				continue
			}
			a.Action(c.action)
		}
	}
}

func (s *Sensor) addConditional(value, actuator, action string) {
	s.conditional = append(s.conditional, &cond{value, actuator, action})
}

func GetOrCreateDevice(uuid string) *Device {
	if d, ok := devices[uuid]; ok {
		return d
	}
	d := &Device{Uuid: uuid}
	devices[uuid] = d
	return d
}

func GetDevice(uuid string) *Device {
	return devices[uuid]
}

func (d *Device) Save() {
	devices[d.Uuid] = d
}
