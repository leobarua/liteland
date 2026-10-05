# Lite Land

<img src="docs/img/brand/lite_land_256.png" alt="Lite Land icon" width="96" align="right">

**by LeoBar** · a lightweight desktop app for object-based land-cover mapping of drone orthomosaics.

Lite Land picks up where [Lite Flight](https://leobarua.github.io/liteflight/) leaves off. Plan and fly the survey with Lite Flight, process the photos into an orthomosaic and surface model in your photogrammetry software, then bring both into Lite Land to map them.

It splits the image into objects, describes each object with up to 23 measurements (colour, visible-light vegetation indices, texture, shape and height), learns your classes from examples you click, classifies the whole scene with a Random Forest, and checks the finished map against an independent sample. It runs offline on one Windows workstation, with an optional NVIDIA GPU for faster segmentation.

## Download

**[Download the trial: LiteLand_Trial_v1.3.zip (2.2 GB, Google Drive)](https://drive.google.com/file/d/1JxOnxnY069Mfg6nPAA1eiSF7T0b4u91c/view?usp=drive_link)** Unzip the whole folder and run `LiteLand_Trial.exe`; no installation, Python or GIS software needed. Windows 10/11, 64-bit.

| | Trial | Full version |
| --- | --- | --- |
| Load, colour-correct, resample, DSM overlay, segment | Yes, on your own data | Yes |
| Segmented / Classified / Blend views | Yes, on the bundled sample session | Yes |
| Classes, training, classification, export to GeoTIFF + QGIS style | — | Yes |
| Save and load workspaces, accuracy assessment | — | Yes |

For the full version, contact ldbarua@gmail.com.

## Manual

The illustrated user manual is at **https://leobarua.github.io/liteland/**. It walks one real 22-hectare drone survey from orthomosaic to accuracy report: getting started, how the method works (segmentation, the 23 object features, Random Forest, retraining, accuracy assessment), every control tab by tab, and a reference section.

## About

Lite Land is built by LeoBar for mapping canopy gaps and land cover from drone surveys of tropical landscapes. The sample survey in the manual and the trial is a hillside campus captured at 8 cm per pixel.
