// Initialize variables
let canvas = document.getElementById('imageCanvas');
let ctx = canvas.getContext('2d');
let image = new Image();
let annotations = [];
let isDrawing = false;
let startX, startY;
let currentAnnotation = {};
let zoomLevel = 1;
let period = null;
let currentAnnotationIndex = 0; // Track current annotation index

// Handle Image Upload
document.getElementById('imageInput').addEventListener('change', handleImageUpload);

// Handle Drawing Events
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);

// Handle Annotation Controls
document.getElementById('addAnnotation').addEventListener('click', addAnnotation);
document.getElementById('saveAnnotations').addEventListener('click', saveAnnotations);
document.getElementById('prevAnnotation').addEventListener('click', showPrevAnnotation);
document.getElementById('nextAnnotation').addEventListener('click', showNextAnnotation);

// Function to Handle Image Upload
function handleImageUpload(event) {
    let reader = new FileReader();
    reader.onload = function(e) {
        image.src = e.target.result;
        image.onload = function() {
            // Set canvas dimensions to match image
            canvas.width = image.width;
            canvas.height = image.height;
            zoomLevel = 1; // Reset zoom level
            drawImage();
            annotations = []; // Reset annotations
            period = null; // Reset period
            currentAnnotationIndex = 0; // Reset index
            document.getElementById('periodInput').disabled = false; // Re-enable period input
            displayAnnotations();
            document.getElementById('downloadLinks').innerHTML = ''; // Clear download links
        };
    };
    reader.readAsDataURL(event.target.files[0]);
}

// Function to Start Drawing
function startDrawing(event) {
    if (!image.src) {
        alert("Please upload an image first.");
        return;
    }
    isDrawing = true;
    let rect = canvas.getBoundingClientRect();
    startX = (event.clientX - rect.left) * (canvas.width / rect.width);
    startY = (event.clientY - rect.top) * (canvas.height / rect.height);
    currentAnnotation = {};
}

// Function to Draw Bounding Box
function draw(event) {
    if (!isDrawing) return;
    let rect = canvas.getBoundingClientRect();
    let mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    let mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
    let width = mouseX - startX;
    let height = mouseY - startY;

    // Redraw image and existing annotations
    drawImage();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, width, height);
}

// Function to Stop Drawing
function stopDrawing(event) {
    if (!isDrawing) return;
    isDrawing = false;
    let rect = canvas.getBoundingClientRect();
    let mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    let mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);
    let width = mouseX - startX;
    let height = mouseY - startY;

    // Ensure width and height are positive
    if (width < 0) {
        startX += width;
        width = Math.abs(width);
    }
    if (height < 0) {
        startY += height;
        height = Math.abs(height);
    }

    currentAnnotation = {
        left: Math.round(startX),
        top: Math.round(startY),
        width: Math.round(width),
        height: Math.round(height)
    };

    // Highlight the drawn rectangle
    drawImage();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(currentAnnotation.left, currentAnnotation.top, currentAnnotation.width, currentAnnotation.height);
}

// Function to Add Annotation
function addAnnotation() {
    if (!currentAnnotation.left && !currentAnnotation.top && !currentAnnotation.width && !currentAnnotation.height) {
        alert("Please draw a bounding box first.");
        return;
    }

    if (annotations.length === 0) {
        // Store the period only once
        period = document.getElementById('periodInput').value.trim();
        if (!period) {
            alert("Please enter a period.");
            return;
        }
        // Disable the period input after the first annotation
        document.getElementById('periodInput').disabled = true;
    }

    let modernText = document.getElementById('modernTextInput').value.trim();
    let iast = document.getElementById('iastInput').value.trim();
    let indicScript = document.getElementById('indicScriptInput').value.trim();

    if (!modernText || !iast || !indicScript) {
        alert("Please fill out all fields.");
        return;
    }

    // Assign a number to the annotation based on order
    let annotationNumber = annotations.length + 1;

    currentAnnotation.period = period;
    currentAnnotation.modern_indic_alphabet = modernText;
    currentAnnotation.iast_alphabet = iast;
    currentAnnotation.indic_script = indicScript;
    currentAnnotation.number = annotationNumber;

    annotations.push(currentAnnotation);

    displayAnnotations();

    // Reset input fields, but keep period as it is now set
    document.getElementById('modernTextInput').value = '';
    document.getElementById('iastInput').value = '';
    document.getElementById('indicScriptInput').value = '';
    currentAnnotation = {};

    // Redraw image with all annotations
    drawImage();
    annotations.forEach(annotation => {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(annotation.left, annotation.top, annotation.width, annotation.height);
        // Add numbering
        ctx.font = "16px Arial";
        ctx.fillStyle = "red";
        ctx.fillText(annotation.number, annotation.left + 5, annotation.top + 20);
    });
}

// Function to Display Annotations List with Navigation
function displayAnnotations() {
    let annotationsList = document.getElementById('annotationsList');
    annotationsList.innerHTML = '';

    annotations.forEach((annotation, index) => {
        let annotationDiv = document.createElement('div');
        annotationDiv.className = 'annotation';
        annotationDiv.innerHTML = `
            <p><strong>Box ${annotation.number}</strong></p>
            <p><strong>Period:</strong> ${annotation.period}</p>
            <p><strong>Modern Indic Alphabet:</strong> ${annotation.modern_indic_alphabet}</p>
            <p><strong>IAST Alphabet:</strong> ${annotation.iast_alphabet}</p>
            <p><strong>Indic Script:</strong> ${annotation.indic_script}</p>
            <p><strong>Coordinates:</strong> (${annotation.left}, ${annotation.top}) [${annotation.width}x${annotation.height}]</p>
            <button onclick="deleteAnnotation(${index})"><i class="fas fa-trash-alt"></i> Delete</button>
            <button onclick="editAnnotation(${index})"><i class="fas fa-edit"></i> Edit</button>
        `;
        annotationsList.appendChild(annotationDiv);
    });
}

// Function to Show Previous Annotation
function showPrevAnnotation() {
    if (currentAnnotationIndex > 0) {
        currentAnnotationIndex--;
        highlightAnnotation(currentAnnotationIndex);
    }
}

// Function to Show Next Annotation
function showNextAnnotation() {
    if (currentAnnotationIndex < annotations.length - 1) {
        currentAnnotationIndex++;
        highlightAnnotation(currentAnnotationIndex);
    }
}

// Function to Highlight Current Annotation
function highlightAnnotation(index) {
    if (annotations.length === 0) return;
    
    drawImage(); // Redraw the image

    // Redraw all annotations
    annotations.forEach((annotation, i) => {
        ctx.strokeStyle = (i === index) ? 'green' : 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(annotation.left, annotation.top, annotation.width, annotation.height);
        ctx.font = "16px Arial";
        ctx.fillStyle = (i === index) ? "green" : "red";
        ctx.fillText(annotation.number, annotation.left + 5, annotation.top + 20);
    });

    // Scroll to the current annotation in the list
    let annotationsList = document.getElementById('annotationsList');
    let currentAnnotationDiv = annotationsList.children[index];
    if (currentAnnotationDiv) {
        currentAnnotationDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Function to Delete Annotation
function deleteAnnotation(index) {
    annotations.splice(index, 1);
    currentAnnotationIndex = 0; // Reset index to first annotation
    displayAnnotations();
    drawImage();
}

// Function to Edit Annotation
function editAnnotation(index) {
    let annotation = annotations[index];
    currentAnnotationIndex = index;
    
    // Fill the input fields with existing annotation details
    document.getElementById('modernTextInput').value = annotation.modern_indic_alphabet;
    document.getElementById('iastInput').value = annotation.iast_alphabet;
    document.getElementById('indicScriptInput').value = annotation.indic_script;
    
    // Highlight the annotation
    highlightAnnotation(index);
}

// Function to Draw Image
function drawImage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

// Function to Save Annotations and Image with Crops
function saveAnnotations() {
    if (annotations.length === 0) {
        alert("No annotations to save.");
        return;
    }

    let imageName = document.getElementById('imageInput').files[0].name;
    let baseName = imageName.split('.').slice(0, -1).join('.');
    
    // Prepare main JSON data
    let data = {
        image: imageName,
        annotations: annotations
    };

    // Prepare ZIP file containing the image and JSON
    let zip = new JSZip();
    zip.file(imageName, document.getElementById('imageInput').files[0]);

    // Create main JSON file for annotations
    let jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    zip.file(baseName + '_annotations.json', jsonBlob);

    // Loop through each annotation, create cropped image, and save individual JSON
    annotations.forEach((annotation, index) => {
        let cropFolder = zip.folder(baseName + '_crop_' + (index + 1));

        // Create cropped image for each annotation
        let cropCanvas = document.createElement('canvas');
        let cropCtx = cropCanvas.getContext('2d');
        cropCanvas.width = annotation.width;
        cropCanvas.height = annotation.height;
        cropCtx.drawImage(
            image,
            annotation.left, annotation.top, annotation.width, annotation.height,
            0, 0, annotation.width, annotation.height
        );

        // Convert cropped image to Blob
        cropCanvas.toBlob(function(blob) {
            cropFolder.file(baseName + '_crop_' + (index + 1) + '.png', blob);

            // Create JSON for cropped annotation
            let cropData = {
                image: baseName + '_crop_' + (index + 1) + '.png',
                annotation: annotation
            };
            let cropJsonBlob = new Blob([JSON.stringify(cropData, null, 2)], { type: 'application/json' });
            cropFolder.file(baseName + '_crop_' + (index + 1) + '_annotation.json', cropJsonBlob);

            // If all crops are processed, generate and download ZIP
            if (index === annotations.length - 1) {
                zip.generateAsync({ type: 'blob' }).then(function(content) {
                    let zipLink = document.createElement('a');
                    zipLink.href = URL.createObjectURL(content);
                    zipLink.download = baseName + '_annotations.zip';
                    zipLink.click();
                });
            }
        });
    });
}
