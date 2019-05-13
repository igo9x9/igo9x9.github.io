package main

import (
	"bufio"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func main() {
	dir, _ := os.Getwd()
	files, _ := ioutil.ReadDir(dir)

	destFile, _ := os.Create("all.txt")
	w := bufio.NewWriter(destFile)
	defer func() {
		w.Flush()
		destFile.Close()
	}()

	req1 := regexp.MustCompile(`TL\[[0-9]+,[0-9]+\]`)

	for _, file := range files {
		if filepath.Ext(file.Name()) != ".sgf" {
			continue
		}
		fmt.Println(file.Name())
		w.WriteString("\n@@@\n\n")
		b, _ := ioutil.ReadFile(file.Name())
		s := string(b)
		ss := strings.Replace(s, "COMLv三段", "", -1)
		ss = strings.Replace(ss, "みんなの囲碁", "", -1)
		ss = strings.Replace(ss, "BS[17]", "", -1)
		ss = strings.Replace(ss, "WS[17]", "", -1)
		ss = strings.Replace(ss, "HA[0]", "", -1)
		ss = strings.Replace(ss, "VW[]", "", -1)
		ss = strings.Replace(ss, "GN[]GC[]", "", -1)
		ss = strings.Replace(ss, "CA[UTF-8]", "", -1)
		ss = req1.ReplaceAllString(ss, "")
		w.Write([]byte(ss))
	}
}
