let ROWS = [];
let LOGGED_IN = false;
let USERNAME = false;
let FOLDER_ID = 0;

let mode = {
    current: "MY DRIVE",

    set: (m) => {
        mode.current = m;
        document.querySelector(".js-mode-title").innerHTML = mode.current;
        let selected = document.querySelector(".class_16");
        selected.classList.remove("class_16");
        selected.classList.add("class_18");
        let new_selected = document.getElementById(m);
        new_selected.classList.remove("class_18");
        new_selected.classList.add("class_16");

        table.refresh(mode.current);
    },

};


const submenu = {
    show: (e) => {
        e.preventDefault();

        table.select(e, "rightclick");

        let menu = document.getElementById("submenu");
        menu.style.left = e.clientX + "px";
        menu.style.top = e.clientY + "px";
        menu.classList.remove("hide");
    },
    hide: () => {
        document.getElementById("submenu").classList.add("hide");
    },
};

const table = {
    selected: null,
    selected_id: null,

    select: (e, mode = "leftclick") => {
        let old_selected_id = table.selected_id;
        table.selected = null;
        table.selected_id = null;

        let tbody = document.getElementById("table-body");
        for (let i = 0; i < tbody.children.length; i++) {
            tbody.children[i].classList.remove("class_38");
        }

        let item = e.target;

        while (item.tagName != "TR" && item.tagName != "BODY") {
            item = item.parentNode;
        }

        if (item.tagName == "TR") {
            if (
                mode == "rightclick" ||
                old_selected_id == null ||
                item.getAttribute("id") !== old_selected_id
            ) {
                table.selected = item;
                table.selected_id = item.getAttribute("id");
                table.selected.classList.add("class_38");

                fileInfo.show(item.getAttribute("id").replace("tr_", ""));
            } else {
                fileInfo.hide();
            }
        }
    },

    changeFolderById: (id) => {
        FOLDER_ID = parseInt(id);
        table.refresh();
    },

    changeFolder: (e) => {
        let item = e.target;

        while (item.tagName != "TR" && item.tagName != "BODY") {
            item = item.parentNode;
        }

        if (item.tagName == "TR") {
            let folderId = item.getAttribute("folder_id");

            if (folderId != null) {
                FOLDER_ID = parseInt(folderId);
                table.refresh();
            }
        }
    },

    refresh: (MODE = "MY DRIVE") => {
        //show a loader
        let tbody = document.querySelector("#table-body");
        tbody.innerHTML = `
			<tr>
				<td colspan = '10' style='text-align:center;padding:10px'>
					<img src="./assets/images/loader.gif" style='width:100px;height:100px'>
				</td>
			</tr>`;

        //hide file info
        fileInfo.hide();

        let myForm = new FormData();

        myForm.append("data_type", "get_files");
        myForm.append("mode", MODE);
        myForm.append("folder_id", FOLDER_ID);

        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", () => {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    let tbody = document.querySelector("#table-body");
                    tbody.innerHTML = "";
                    console.log(xhr.responseText);

                    let obj = JSON.parse(xhr.responseText);

                    //display username
                    if (!USERNAME) {
                        USERNAME = obj.username;
                        document.querySelector(".username").innerHTML = obj.username;
                    }

                    //check user logged in
                    LOGGED_IN = obj.LOGGED_IN;
                    if (!LOGGED_IN) window.location.href = "login.html";

                    //update breadcrumbs
                    let crumbs = document.querySelector("#breadcrumbs");
                    crumbs.innerHTML = `<div onclick="table.changeFolderById(0)" class="class_24">My Drive</div>`;

                    for (let i = obj.breadcrumbs.length - 1; i >= 0; i--) {
                        let className = "class_25";
                        if (i == 0) className = "class_26";
                        crumbs.innerHTML += `<div class=${className} onclick="table.changeFolderById(${obj.breadcrumbs[i].id})">${obj.breadcrumbs[i].name}</div>`;
                    }

                    if (obj.succes && obj.data_type == "get_files") {
                        //update drive space
                        let driveOccupied = (
                            obj.drive_occupied /
                            (1024 * 1024 * 1024)
                        ).toFixed(2);
                        let drivePercent = Math.round(
                            (driveOccupied / obj.drive_total) * 100
                        );

                        document.querySelector(
                            ".js-drive-space-text"
                        ).innerHTML = `${driveOccupied} GB / ${obj.drive_total} GB`;
                        document.querySelector(
                            ".js-drive-space-percent"
                        ).style.width = `${drivePercent}%`;

                        ROWS = obj.rows;
                        for (let i = 0; i < obj.rows.length; i++) {
                            let tr = document.createElement("tr");
                            tr.setAttribute("id", "tr_" + i);

                            //mark row as a folder
                            if (obj.rows[i].file_type == "folder") {
                                tr.setAttribute("type", "folder");
                            } else {
                                tr.setAttribute("type", "file");
                            }

                            //set folder_id attribute when this is  a folder
                            if (obj.rows[i].file_type == "folder")
                                tr.setAttribute("folder_id", obj.rows[i].id);

                            // set favorite star
                            let star = '<i class="bi bi-star class_34">';
                            if (obj.rows[i].favorite == 1)
                                star = '<i class="bi bi-star-fill class_34">';

                            tr.innerHTML = `
									<td>${obj.rows[i].icon}</td>
									<td style="max-width:200px">${obj.rows[i].file_name}</td>
									<td>${star}</td>
									<td>${obj.rows[i].file_type}</td>
									<td>${obj.rows[i].date_created}</td>
									<td>${obj.rows[i].date_updated}</td>
									<td>${obj.rows[i].file_size}</td>
									<td><i class="bi bi-cloud-download-fill class_34"></i></td>
								`;
                            tbody.appendChild(tr);
                        }
                    } else {
                        tbody.innerHTML =
                            "<tr><td colspan = '10' style ='text-align:center'>No files found!</td></tr>";
                    }
                } else console.log(xhr.responseText);
            }
        });

        xhr.open("post", "api.php", true);
        xhr.send(myForm);
        //recreate table
    },

    deleteRow: () => {
        if (!table.selected) {
            alert("Please select a row to delete!");
            return;
        }

        if (!confirm("Are you sure want to delete the item?")) {
            return;
        }

        let obj = {};

        obj.data_type = "delete_row";
        obj.file_type = table.selected.getAttribute("type");
        let id = table.selected.getAttribute("id").replace("tr_", "");
        obj.id = ROWS[id].id;

        action.send(obj);
    },

    logout: () => {
        let myForm = new FormData();

        myForm.append("data_type", "user_logout");

        let xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", () => {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    window.location.href = "login.html";
                } else console.log(xhr.responseText);
            }
        });

        xhr.open("post", "api.php", true);
        xhr.send(myForm);
        //recreate table
    },
};

const upload = {
    cancelled: false,
    uploading: false,

    cancel: () => {
        upload.cancelled = true;
    },

    resetProgress: () => {
        document.querySelector(".js-prog").style.width = "0%";
        document.querySelector(".js-prog-text").innerHTML = "0%";
        document.querySelector(".js-prog-holder").classList.add("hide");
    },

    send: (files) => {
        if (upload.uploading) {
            alert("Please wait for the previous upload to finish!");
            return;
        }
        upload.uploading = true;
        upload.cancelled = false;
        let myForm = new FormData();

        myForm.append("data_type", "upload_files");
        myForm.append("folder_id", FOLDER_ID);

        for (let i = 0; i < files.length; i++) {
            myForm.append("file" + i, files[i]);
        }

        upload.resetProgress();
        document.querySelector(".js-prog-holder").classList.remove("hide");

        let xhr = new XMLHttpRequest();

        xhr.addEventListener("error", (e) => {
            alert("An error occured! Please check yout internet connection!");
        });

        xhr.upload.addEventListener("progress", (e) => {
            let percent = Math.round((e.loaded / e.total) * 100);
            document.querySelector(".js-prog").style.width = percent + "%";
            document.querySelector(".js-prog-text").innerHTML = percent + "%";

            if (upload.cancelled) {
                xhr.abort();
                alert("Your upload is canceled!");
                upload.resetProgress();
            }
        });

        xhr.addEventListener("readystatechange", () => {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    upload.resetProgress();
                    let obj = JSON.parse(xhr.responseText);
                    if (obj.succes) {
                        alert("Upload complete!");
                        table.refresh();
                    } else {
                        alert("Could not complete file upload!");
                    }
                    upload.resetProgress();
                } else {
                    console.log(xhr.responseText);
                    alert("An error occured! Please try again later!");
                }
                upload.uploading = false;
            }
        });

        xhr.open("post", "api.php", true);
        xhr.send(myForm);
    },

    drop: (e) => {
        e.preventDefault();
        upload.dropZone.removeHighlight();
        console.log(e.dataTransfer.files);
        upload.send(e.dataTransfer.files);
    },

    dragOver: (e) => {
        e.preventDefault();
        upload.dropZone.highlight();
    },

    dropZone: {
        highlight: () => {
            document.querySelector(".drop-zone").classList.add("drop-zone-highlight");
        },
        removeHighlight: () => {
            document
                .querySelector(".drop-zone")
                .classList.remove("drop-zone-highlight");
        },
    },
};

let fileInfo = {
    show: (id) => {
        let row = ROWS[id];
        document.querySelector(".js-info-no-file").classList.add("hide");
        let fileInfoPanel = document.querySelector(".js-file-info");
        fileInfoPanel.classList.remove("hide");
        fileInfoPanel.querySelector("#file").innerHTML = row.file_name;
        fileInfoPanel.querySelector("#size").innerHTML = row.file_size;
        fileInfoPanel.querySelector("#type").innerHTML = row.file_type;
        fileInfoPanel.querySelector("#dateModified").innerHTML = row.date_updated;
        fileInfoPanel.querySelector("#dateAdded").innerHTML = row.date_created;
    },

    hide: () => {
        document.querySelector(".js-info-no-file").classList.remove("hide");
        document.querySelector(".js-file-info").classList.add("hide");
    },
};

const action = {
    uploading: false,

    newFolder: () => {
        let box = document.querySelector(".new-folder");
        let text = box.querySelector("input").value.trim();
        box.classList.add("hide");

        let obj = {};
        obj.data_type = "new_folder";
        obj.name = text;
        obj.folder_id = FOLDER_ID;

        action.send(obj);
    },

    showNewFolder: () => {
        let box = document.querySelector(".new-folder");
        box.classList.remove("hide");
        box.querySelector("input").value = "";
        box.querySelector("input").focus();
    },

    hideNewFolder: () =>
        document.querySelector(".new-folder").classList.add("hide"),

    send: (obj) => {
        if (action.uploading) {
            alert("Please wait for the previous upload to finish!");
            return;
        }
        action.uploading = true;
        let myForm = new FormData();

        for (key in obj) {
            myForm.append(key, obj[key]);
        }

        let xhr = new XMLHttpRequest();

        xhr.addEventListener("error", (e) => {
            alert("An error occured! Please check yout internet connection!");
        });

        xhr.addEventListener("readystatechange", () => {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    action.handleResult(xhr.responseText);
                } else {
                    console.log(xhr.responseText);
                    alert("An error occured! Please try again later!");
                }
                action.uploading = false;
            }
        });

        xhr.open("post", "api.php", true);
        xhr.send(myForm);

        table.refresh();
    },

    handleResult: (result) => {
        alert(result);

        let obj = JSON.parse(result);

        if (obj.succes) {
            table.refresh();
        } else {
            alert("Could not complete operation!");
        }

        alert(result);
    },
};

table.refresh("");
window.addEventListener("click", submenu.hide);