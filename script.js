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
        menu.style.top = e.clientY + window.scrollY + "px";
        let id = table.selected.getAttribute("id").replace("tr_", "");

        //if it a folder remove buttons what can't be used
        if (ROWS[id].file_type == "folder") {
            document.querySelector("#submenu-favorite").classList.add("hide");
            document.querySelector("#submenu-download").classList.add("hide");
            document.querySelector("#submenu-preview").classList.add("hide");
        } else {
            document.querySelector("#submenu-favorite").classList.remove("hide");
            document.querySelector("#submenu-download").classList.remove("hide");
            document.querySelector("#submenu-preview").classList.remove("hide");
        }

        //change favorite button text depends on favorite status
        if (ROWS[id].favorite == 1)
            document.querySelector("#submenu .js-favorite-text").innerHTML =
                "Remove from favorites";
        else
            document.querySelector("#submenu .js-favorite-text").innerHTML =
                "Add to favorites";

        //hide the restore when not in trash folder
        if (mode.current == "TRASH")
            document.querySelector("#submenu-restore").classList.remove("hide");
        else document.querySelector("#submenu-restore").classList.add("hide");

        menu.classList.remove("hide");
    },
    hide: () => {
        document.getElementById("submenu").classList.add("hide");
    },
};

//File sharing
const share = {
    addEmail: (email) => {
        if (email == "") {
            alert("Type an email first");
            document.querySelector(".js-access-email-input").focus();
            return;
        }
        let holder = document.querySelector(".js-access-email-holder");
        let div = document.createElement("div");
        div.setAttribute("class", "access-email ");
        div.innerHTML = `
            <div>${email}</div>
            <div onclick="share.removeEmail(event)">+</div>
            <input type="hidden" value="${email}">
        `;

        holder.insertBefore(div, holder.children[0]);

        document.querySelector(".js-access-email-input").focus();
        document.querySelector(".js-access-email-input").innerHTML = "";
    },

    removeEmail: (e) => {
        if (!confirm("Are you sure want to remove access to this email?")) return;
        e.currentTarget.parentNode.remove();
    },

    refresh: (obj) => {
        document.querySelector(".js-access-email-holder").innerHTML = "";

        let rows = JSON.parse(obj);
        rows.forEach((element) => {
            share.addEmail(element.email);
        });
    },
};

const table = {
    selected: null,
    selected_id: null,
    pageNumber: 1,

    nextPage: () => {
        table.pageNumber += 1;

        table.refresh(mode.current, table.pageNumber);
        document.querySelector(".js-page-number").innerHTML = "Page " + table.pageNumber;
    },

    prevPage: () => {
        table.pageNumber -= 1;
        if (table.pageNumber < 1) table.pageNumber = 1;

        table.refresh(mode.current, table.pageNumber);
        document.querySelector(".js-page-number").innerHTML = "Page " + table.pageNumber;
    },

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

    refresh: (MODE = "MY DRIVE", PAGE = 1) => {
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
        myForm.append("page_number", PAGE);
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

                    //update drive space
                    if (obj.succes && obj.data_type == "get_files") {
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

                            //add folder_id attribute when this is  a folder
                            if (obj.rows[i].file_type == "folder")
                                tr.setAttribute("folder_id", obj.rows[i].id);

                            // set favorite star
                            let star = "";
                            if (obj.rows[i].file_type != "folder") {
                                star = '<i class="bi bi-star class_34">';
                                if (obj.rows[i].favorite == 1)
                                    star = '<i class="bi bi-star-fill class_34">';
                            }
                            //remove download button from list when folder
                            let downloadLink = "";
                            if (obj.rows[i].file_type != "folder") {
                                downloadLink = `
                                <a href="download.php?id=${obj.rows[i].id}">
                                    <i class="bi bi-cloud-download-fill class_34"></i>
                                </a>`;
                            }

                            //set share mode icon depends on the share mode
                            let shareModeIcon = `<i title = "Not shared" class="bi bi-person-x-fill class_34"></i>`;
                            if (obj.rows[i].share_mode == 1) {
                                shareModeIcon = `
                                    <i title = "Shared whit specific users" class="bi bi-people-fill class_34"></i>
                                </a>`;
                            } else if (obj.rows[i].share_mode == 2) {
                                shareModeIcon = `
                                    <i title = "Shared public" class="bi bi-globe class_34"></i>
                                </a>`;
                            }

                            tr.innerHTML = `
									<td>${obj.rows[i].icon}</td>
									<td style="max-width:17em">${obj.rows[i].file_name}</td>
									<td>${star}</td>
									<td>${obj.rows[i].file_type}</td>
									<td style="max-width:5em">${shareModeIcon}</td>
									<td>${obj.rows[i].date_updated}</td>
									<td>${obj.rows[i].file_size}</td>
									<td>
                                        ${downloadLink}
                                    </td>`;

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

    restoreRow: () => {
        if (!table.selected) {
            alert("Please select a row to restore!");
            return;
        }

        if (!confirm("Are you sure want to restore the item?")) {
            return;
        }

        let obj = {};

        obj.data_type = "restore_row";
        obj.file_type = table.selected.getAttribute("type");
        let id = table.selected.getAttribute("id").replace("tr_", "");
        obj.id = ROWS[id].id;

        action.send(obj);
    },

    previewFile: () => {
        let id = table.selected.getAttribute("id").replace("tr_", "");
        window.open("preview.html?id=" + ROWS[id].slug, "_blank");
    },

    downloadFile: () => {
        let id = table.selected.getAttribute("id").replace("tr_", "");
        window.location.href = "download.php?id=" + ROWS[id].id;
    },

    addToFavorite: () => {
        let id = table.selected.getAttribute("id").replace("tr_", "");
        let obj = {};

        obj.id = ROWS[id].id;
        obj.data_type = "add_to_favorites";

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
            document.querySelector(".drop-zone").classList.remove("drop-zone-highlight");
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
    rootPath: "http://localhost/my_drive/",

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

    hideNewFolder: () => document.querySelector(".new-folder").classList.add("hide"),

    showShareFile: () => {
        //get selected file info
        let id = table.selected.getAttribute("id").replace("tr_", "");

        //show the share box and data
        let box = document.querySelector(".js-share");
        box.classList.remove("hide");
        box.querySelector(".js-share-filename").innerHTML = ROWS[id].file_name;
        box.querySelector(".js-share-input").value =
            action.rootPath + "preview.html?id=" + ROWS[id].slug;
        box.querySelector(".js-share-input").focus();
        box.querySelector(".js-sharemode-" + ROWS[id].share_mode).checked = true;

        share.refresh(ROWS[id].emails);
    },

    shareFile: () => {
        let box = document.querySelector(".js-share");
        let radios = box.querySelectorAll(".radio");
        let shareMode = 0;

        radios.forEach((element) => {
            if (element.checked) shareMode = element.value;
        });

        box.classList.add("hide");

        //grab email adresses
        let inputs = document
            .querySelector(".js-access-email-holder")
            .querySelectorAll("input");
        let emails = [];
        inputs.forEach((element) => {
            emails.push(element.value);
        });

        let obj = {};
        obj.id = ROWS[table.selected.getAttribute("id").replace("tr_", "")].id;
        obj.data_type = "share_file";
        obj.emails = JSON.stringify(emails);
        obj.share_mode = shareMode;
        obj.folder_id = FOLDER_ID;

        action.send(obj);
    },

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
    },

    handleResult: (result) => {
        let obj = JSON.parse(result);

        if (obj.succes) {
            table.refresh(mode.current);
        } else {
            alert("Could not complete operation!");
        }
    },
};

table.refresh("");
window.addEventListener("click", submenu.hide);
