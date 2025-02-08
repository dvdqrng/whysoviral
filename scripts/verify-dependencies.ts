import axios from "axios"
import * as cheerio from "cheerio"

async function verifyDependencies() {
  console.log("Verifying axios and cheerio installation...")

  // Verify axios
  try {
    const response = await axios.get("https://example.com")
    console.log("Axios is working correctly. Status:", response.status)
  } catch (error) {
    console.error("Error with axios:", error.message)
  }

  // Verify cheerio
  try {
    const html = "<html><body><h1>Hello, Cheerio!</h1></body></html>"
    const $ = cheerio.load(html)
    const text = $("h1").text()
    console.log("Cheerio is working correctly. Parsed text:", text)
  } catch (error) {
    console.error("Error with cheerio:", error.message)
  }
}

verifyDependencies()

