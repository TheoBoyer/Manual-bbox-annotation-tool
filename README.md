# 🐳&🐬 Manual Bounding box annotation app

## Context
This little project is being developped during the [2022 happywhale competition](https://www.kaggle.com/c/happy-whale-and-dolphin).
As it was noticed by many participants, the individuals within images can be tiny compared to the total image's size, and a lot of elements that may not be informative if not missleading are present in the pictures.
As such, a participant released a notebook: [Happywhale: Cropped Dataset [YOLOv5] ✂️](https://www.kaggle.com/awsaf49/happywhale-cropped-dataset-yolov5) leveraging an old dataset made for a previous competition involving whale tails.
The problem is that the resulting dataset contains numerous failure cases and slight inaccuracies that could harm the performances of a model trained on the cropped dataset:

<p float="center">
<img src="https://i.imgur.com/ZqsaZio.png" width="180" style="display:inline-block"/>
<img src="https://i.imgur.com/0cWky4A.png" width="180" style="display:inline-block"/>
<img src="https://i.imgur.com/HNu69Ey.png" width="180" style="display:inline-block"/>
<img src="https://i.imgur.com/RLn2lSA.png" width="180" style="display:inline-block"/>
<img src="https://i.imgur.com/5drD858.png" width="180" style="display:inline-block"/>
</p>

In this repo, you will find the source code for an app aiming at crowd sourcing a bounding boxes dataset for this competition. 

## How it works
On the app, users can either annotate images or review other annotations.

### Bounding box annotation
Uses the mouse to place two points defining the bounding box. Note that the final bounding box will include the pixels **within** the visual boundaries (meaning that the pixels used to draw the boundaries are not in it)

### Annotation review

### Download the dataset
On the home page you can find buttons to download directly either the raw annotations with review informations or the final dataset constituted of manually reviewed samples. You can also download the dataset in a kaggle notebook directly by copying the links at the bottom of the page.

### Additionnal informations
* The app doesn't start from scratch, some annotations are already entered and just need a manual review. The annotations were obtained by taking the dataset from [Happywhale: Cropped Dataset [YOLOv5] ✂️](https://www.kaggle.com/awsaf49/happywhale-cropped-dataset-yolov5) and filtered using the methods described in [🐳&🐬 - Filter YOLOv5 failure cases](https://www.kaggle.com/wolfy73/filter-yolov5-failure-cases)
* Only the training images are in the app to comply with the competition's rules 
