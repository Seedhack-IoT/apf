package main

import (
	"bufio"
	"fmt"
	"io/ioutil"
	"log"
	"net"
	"os"

	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/terminal"
)

const (
	DataChannel = "apf_data"
)

var userStore map[string][]byte

func init() {
	userStore = make(map[string][]byte)
}

func StartSSH(address string) {
	reader := bufio.NewReader(os.Stdin)

	// Create SSH public key authentication method, with delayed validation.
	config := &ssh.ServerConfig{
		PublicKeyCallback: func(conn ssh.ConnMetadata, key ssh.PublicKey) (*ssh.Permissions, error) {
			user := conn.User()
			mk := key.Marshal()
			if pk, ok := userStore[user]; ok != false {
				if string(pk) == string(mk) {
					return nil, nil
				}
			} else {
				// await on terminal for input:0
				fmt.Printf("Accept connection from user %s? y/n: ", user)
				input, _ := reader.ReadString('\n')
				if len(input) >= 1 && input[0] == 'y' {
					userStore[user] = mk
					return nil, nil
				}
			}
			fmt.Printf("Access denied for user %s\n", user)
			// otherwise reject
			return nil, fmt.Errorf("Access denied.")
		},
	}

	// You can generate a keypair with 'ssh-keygen -t rsa'
	privateBytes, err := ioutil.ReadFile("keys/key")
	if err != nil {
		log.Fatal("Failed to load private key (./key/key)")
	}

	private, err := ssh.ParsePrivateKey(privateBytes)
	if err != nil {
		log.Fatal("Failed to parse private key")
	}

	config.AddHostKey(private)

	// Once a ServerConfig has been configured, connections can be accepted.
	listener, err := net.Listen("tcp", address)
	if err != nil {
		log.Fatalf("Failed to listen on %s (%s)", address, err)
	}

	// Accept all connections
	log.Printf("Listening on %s...", address)
	for {
		tcpConn, err := listener.Accept()
		if err != nil {
			log.Printf("Failed to accept incoming connection (%s)", err)
			continue
		}
		// Before use, a handshake must be performed on the incoming net.Conn.
		sshConn, chans, reqs, err := ssh.NewServerConn(tcpConn, config)
		if err != nil {
			log.Printf("Failed to handshake (%s)", err)
			continue
		}

		log.Printf("New SSH connection from %s (%s)", sshConn.RemoteAddr(), sshConn.ClientVersion())
		// Discard all global out-of-band Requests
		go handleRequests(reqs)
		// Accept all channels
		go handleChannels(chans)
	}
}

func handleRequests(requests <-chan *ssh.Request) {
	for req := range requests {
		log.Printf("Recieved out-of-band request: %+v", req)
	}
}

func handleChannels(chans <-chan ssh.NewChannel) {
	// Service the incoming Channel channel.
	for newChannel := range chans {
		if t := newChannel.ChannelType(); t == "session" {
			// for shell debugging
			channel, requests, err := newChannel.Accept()
			if err != nil {
				log.Printf("Could not accept channel (%s)", err)
				continue
			}
			handleChannel(channel, requests)
		} else if t == DataChannel {
			// for actual connections
		} else {
			newChannel.Reject(ssh.UnknownChannelType, fmt.Sprintf("unknown channel type: %s", t))
			continue
		}

	}
}

// in this function we have an SSH connection.
func handleChannel(channel ssh.Channel, requests <-chan *ssh.Request) {
	// prepare teardown function
	//	close := func() {
	//		channel.Close()
	//		log.Printf("Session closed")
	//	}

	go func(in <-chan *ssh.Request) {
		for req := range in {
			ok := false
			switch req.Type {
			case "shell":
				ok = true
				if len(req.Payload) > 0 {
					// We don't accept any
					// commands, only the
					// default shell.
					ok = false
				}
			}
			req.Reply(ok, nil)
		}
	}(requests)

	term := terminal.NewTerminal(channel, ":D > ")
	go func() {
		defer channel.Close()
		for {
			line, err := term.ReadLine()
			if err != nil {
				break
			}
			fmt.Println(line)
		}
	}()
}
