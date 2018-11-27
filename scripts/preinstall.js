var download = require("./download").download;
var child_process = require("child_process");
var path = require("path");
var fs = require("fs");

var ARCH = process.arch;
var ZMQ = "4.2.5";
var ZMQ_REPO = "libzmq";

if (process.env.npm_config_zmq_external == "true") {
  console.log("Requested to use external libzmq. Skipping libzmq build");
  process.exit(0);
}

function buildZMQ(scriptPathSrc, zmqDir) {
  console.log("Building libzmq for " + process.platform);

  var scriptPath = scriptPathSrc;

  var child;

  if (process.platform === "win32") {
    scriptPath = scriptPath.replace(/sh$/, 'cmd');
    child = child_process.spawn('cmd.exe', ['/c', scriptPath, ZMQ, ARCH]);

  } else {
    child = child_process.spawn(scriptPath, [ZMQ, ARCH]);
  }

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.on("error", function(err) {
    console.error("Failed to start child process.");
  });

  child.on("close", function(code) {
    if (code !== 0) {
      return console.error("child process exited with code " + code);
    }
    var message = "Succesfully build libzmq on " + Date();
    fs.writeFile(path.join(zmqDir, "BUILD_SUCCESS"), message, function(err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(message);
    });
  });
}

function handleError(err) {
  if (!err) {
    return;
  }
  console.error(err);
  if (err.code === "ECONNRESET") {
    console.error("\n** Your connection was reset. **");
    console.error(
      "\n** Are you behind a proxy or a firewall that is preventing a connection? **"
    );
  }
  process.exit(1);
}

function downloadAndBuild() {
  var SCRIPT_PATH = path.join(__dirname, "build_libzmq.sh");
  var TAR_URL =
    "https://github.com/zeromq/" +
    ZMQ_REPO +
    "/releases/download/v" +
    ZMQ +
    "/zeromq-" +
    ZMQ +
    ".tar.gz";
  var DIR_NAME = path.join(__dirname, "..", "zmq");
  var FILE_NAME = path.join(DIR_NAME, "zeromq-" + ZMQ + ".tar.gz");

  if (!fs.existsSync(DIR_NAME)) {
    fs.mkdirSync(DIR_NAME);
  }

  if (fs.existsSync(path.join(DIR_NAME, "BUILD_SUCCESS"))) {
    console.log("Libzmq found, skipping rebuild.");
    process.exit(0);
  }

  if (fs.existsSync(FILE_NAME)) {
    buildZMQ(SCRIPT_PATH, DIR_NAME);
    return;
  }

  download(TAR_URL, FILE_NAME, function(err) {
    if (err) {
      handleError(err);
    }
    buildZMQ(SCRIPT_PATH, DIR_NAME);
  });
}

downloadAndBuild();
