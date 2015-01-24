package main

func main() {
	go StartSSH(":2200")
	StartHTTP(":8000")
}
