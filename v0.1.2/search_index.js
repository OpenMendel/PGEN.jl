var documenterSearchIndex = {"docs":
[{"location":"PGEN_description/#The-PGEN-format","page":"PGEN format description","title":"The PGEN format","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Content on this page is based on the draft specification, distributed under GPLv3. ","category":"page"},{"location":"PGEN_description/#Introduction","page":"PGEN format description","title":"Introduction","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"The PGEN format is the central file format for genomic data in PLINK 2. ","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"PLINK 1’s binary genotype file format (the BED format, can be read using SnpArrays.jl)\nSimple, compact, and supports direct computation on the packed data representation. Thanks to these properties, it continues to be widely used more than a decade after it was designed.\nLimitation: can only represent unphased biallelic hard-called genotypes.\nsuboptimal for GWASes which tend to benefit from inclusion of imputed dosages and more sophicated handling of multiallelic variants\ncannot represent phase information for workflows like investigation of compound heterozygosity, imputation-related data management, etc.","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"The widely-used binary genotype formats which addresses limitations above include BCF format and BGEN format, but they do not support direct computation on packed data, impossible to match efficiency of PLINK 1.9. ","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Hence, PLINK 2 decided to introduce a new binary genotype file format, the PGEN format. ","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Backward-compatible to BED format\nCan represent phased, multiallelic, and dosage data in a manner that better support \"compressive genomics\"\nIncorporates \"SNPack-style\" genotype compression, reducing file sizes by 80+% with negligible encoding and decoding cost (and supporting some direct computation on the compressed representation)","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Not as simple as PLINK 1 format, but now it includes open-source internal library (pgenlib) to read and write the format. ","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Also introduced are: ","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"PSAM format, an extension of .fam format\nStores categorical and other phenotype/covariates\nPVAR format, an extension of .bim format.\nStores all header and variant-specific information. \nDesigned so that \"sites-only VCF\" files are directly valid PVAR files.","category":"page"},{"location":"PGEN_description/#PGEN-format","page":"PGEN format description","title":"PGEN format","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Binary format capable of representing mixed-phase, multiallelic, mixed-hardcall/dosage/missing genotype data.","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"A PLINK 1 variant-major .bed file is grandfathered in as a valid PGEN file. Simple to handle with the PGEN format definition.\nPGEN(+PVAR) is designed to interoperate with, not replace, VCF/BCF. \nPGEN cannot represent: read depths, quality scores, or biallelic genotype probability triplets, or triploid genotypes. \nIt specializes on the subset of the VCF format which is relevant to PLINK’s function. \nFast VCF ↔ PGEN conversion in PLINK 2.","category":"page"},{"location":"PGEN_description/#File-organization","page":"PGEN format description","title":"File organization","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Header: information to enable random access to the variant record: e.g., record types and record length of each variant.\nHere, record type means how the genotype is compressed, if it contains phase and dosage information, etc. \nA sequence of variant records.","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"A variant record’s main data track can be “LD-compressed” (LD = linkage disequilibrium):","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Most recent non-LD-compressed variant record and only storing genotype-category differences from it. \nThe only type of inter-record dependency, \nRecord type and size information in the header, and the genotypes from the latest non-LD-compressed variant is enough to decode genotypes of each variant sequentially.","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"<!– Three fixed-width storage modes are defined (covering basic unphased biallelic genotypes, unphased dosages, and phased dosages) which don’t have this limitation, and are especially straightforward to read and write; but they don’t benefit from PGEN’s low-overhead genotype compression. A future version of this specification may add a way to store most header information in a separate file, so that sequential reading, sequential writing, and genotype compression are simultaneously possible (at the cost of more annoying file management).–>","category":"page"},{"location":"PGEN_description/#Header","page":"PGEN format description","title":"Header","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Magic number: 0x6c 0x1b. \nStorage mode\n0x01: PLINK 1 BED format. Supported in SnpArrays.jl.\n0x02: the simplest PLINK 2 fixed-width format for unphased genotypes. Difference from 0x01 are header and genotype encoding rule.\n0x03: fixed-width unphased dosage\n0x04: fixed-width phased dosage\n0x10: standard variable-width format. Vast majority of the PLINK 2 files will be in this mode. Currently, only this mode is supported in PGEN.jl. \nDataset dimensions, header body formatting\nnumber of variants, samples, bits per record type, bytes per allele counts (for multiallelic variants), if reference alleles are provisional, etc.\nVariant block offsets\nWhere each block of 2^16 = 65,536 variant records begin. i.e. starting point of variant 1, 65537, 131073, ... \nMain header body\nPacked array of 2^16 record types, lengths, etc. ","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"e.g., random access to 65540-th (65536 + 4) variant can be achieved by scannig for the 2nd entry of Variant block offsets and then scanning the first four entries of main header body. The starting point of the variant is calculated by the start of the second variant block plus first three variant record lengths. ","category":"page"},{"location":"PGEN_description/#Variant-record","page":"PGEN format description","title":"Variant record","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Each variant record starts with the main track for unphased biallelic hard-call genotypes, followed by the ten optional tracks:","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Multiallelic hard-calls\nHardcall-phase information\nBiallelic dosage existence\nBiallelic dosage values\nMultiallelic dosage existence\nMultiallelic dosage values\nBiallelic phased-dosage existence\nBiallelic phased-dosage values\nMultiallelic phased-dosage existence\nMultiallelic phased-dosage values","category":"page"},{"location":"PGEN_description/#Difflists","page":"PGEN format description","title":"Difflists","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Many genotypes and dosages are compressed in a difflist. It is designed to represent a sparse list of differences from something else. It does so in a manner that is compact, and supports fast checking of whether a specific sample ID is in the list. Struct for difflist is in the struct DiffList. ","category":"page"},{"location":"PGEN_description/#Main-track","page":"PGEN format description","title":"Main track","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Each genotype is represented in two-bit little-endian ordering: e.g., the for the two bytes of 0x1b 0xd8 for 8 samples:","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"byte 1         byte 2\n0x1b           0xd8\n00 01 10 11    11 01 10 00\ns4 s3 s2 s1    s8 s7 s6 s5","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Sample index (1-based) genotype category\n1 0b11\n2 0b10\n3 0b01\n4 0b00\n5 0b00\n6 0b10\n7 0b01\n8 0b11","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"genotype category PLINK 1 PLINK 2\n0 = 0b00 = 0x00 homozygous A1 homozygous REF\n1 = 0b01 = 0x01 missing heterozygous REF-ALT\n2 = 0b10 = 0x02 heterozygouus A1-A2 homozygous ALT\n3 = 0b11 = 0x03 homozygous A2 missing","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"A1: First allele listed in PLINK 1 bim file\nA2: Second allele listed in PLINK 1 bim file\nREF: Reference allele\nALT: Alternate allele","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"In PLINK 1, A1 was often ALT, and A2 was often REF. However, this was not set in stone. In UK Biobank data, A1 is REF and A2 is ALT. ","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Seven record types are supported, represented by the bottom three bits of record type:","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"0: no compression.\n1: “1-bit” representation. This starts with a byte indicating what the two most common categories are (value 1: categories 0 and 1; 2: 0 and 2; 3: 0 and 3; 5: 1 and 2; 6: 1 and 3; 9: 2 and 3); followed by a bitarray describing which samples are in the higher-numbered category; followed by a difflist with all (sample ID, genotype category value) pairs for the two less common categories.\n2: LD-compressed. A difflist with all (sample ID, genotype category value) pairs for samples in different categories than they were in in the previous non-LD-compressed variant. The first variant of a variant block (i.e. its index is congruent to 0 mod 2^16) cannot be LD-compressed.\n3: LD-compressed, inverted. A difflist with all (sample ID, inverted genotype value) pairs for samples in different categories than they would be in the previous non-LD-compressed variant after inversion (categories 0 and 2 swapped). I.e. decoding can be handled in the same way as for variant record type 2, except for a final inversion step applied after the difflist contents have been patched in. This addresses spots where the reference genome is “wrong” for the population of interest.\n4: Difflist with all (sample ID, genotype category value) pairs for samples outside category 0.\n~~5: Reserved for future use. (When all samples appear to be in category 1, that usually implies a systematic variant calling problem.)~~\n6: Difflist with all (sample ID, genotype category value) pairs for samples outside category 2.\n7: Difflist with all (sample ID, genotype category value) pairs for samples outside category 3","category":"page"},{"location":"PGEN_description/#Multiallelic-hardcalls","page":"PGEN format description","title":"Multiallelic hardcalls","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Exists if the 4th bit of variant record type is set. Based on the main track, it defines a \"patch set\" in the form of difflist which sample has alternate allele other than \"ALT1\". ","category":"page"},{"location":"PGEN_description/#Phased-heterozygous-hard-calls","page":"PGEN format description","title":"Phased heterozygous hard-calls","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Exists if the 5th bit of variant record type is set. Stores whether each heterozygous call is phased, and if phased, what the phase is. \"0|1\" or \"1|0\". PGEN does not distinguish \"0|0\" from \"0/0\", and \"1|1\" from \"1/1\". ","category":"page"},{"location":"PGEN_description/#Dosages","page":"PGEN format description","title":"Dosages","text":"","category":"section"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Dosages are stored in 16-bit integers (UInt16). 0x0000...0x8000(2^15) represent diploid ALT allele dosage values between 0.0..2.0. 0xffff represents missing value. Three record types are supported, based on 6th and 7th bits of record type. Dosages are required to be consistent with hard-calls (should be close enough from genotype).","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"6th bit is set and 7th bit is clear: Track 3 (Biallelic dosage existence) is a difflist indicating which samples have dosage information. \n6th bit is clear and 7th bit is set: Track 3 is omitted and Track 4 (Biallelic dosage values) has an entry for every single sample.\n6th bit and 7th bit are both set: Track 3 is a BitArray indicating dosage for which sample exists. ","category":"page"},{"location":"PGEN_description/","page":"PGEN format description","title":"PGEN format description","text":"Samples without dosage values are assumed to have dosage level identical to their respective genotypes.","category":"page"},{"location":"#PGENFiles.jl","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl","text":"","category":"section"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"Routines for reading compressed storage of genotyped or imputed markers","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"Genome-wide association studies (GWAS) data with imputed markers are often saved in the PGEN format in .pgen file. It can store both hard calls and imputed data, unphased genotypes and phased haplotypes. Each variant is compressed separately. This is the central data format for PLINK 2. ","category":"page"},{"location":"#Format-description","page":"PGENFiles.jl Tutorial","title":"Format description","text":"","category":"section"},{"location":"#Installation","page":"PGENFiles.jl Tutorial","title":"Installation","text":"","category":"section"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"This package requires Julia v1.6 or later, which can be obtained from https://julialang.org/downloads/ or by building Julia from the sources in the https://github.com/JuliaLang/julia repository.","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"This package is registered in the default Julia package registry, and can be installed through standard package installation procedure: e.g., running the following code in Julia REPL.","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"using Pkg\npkg\"add https://github.com/OpenMendel/PGENFiles.jl\"","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"versioninfo()","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"Julia Version 1.7.1\nCommit ac5cc99908 (2021-12-22 19:35 UTC)\nPlatform Info:\n  OS: macOS (x86_64-apple-darwin19.5.0)\n  CPU: Intel(R) Core(TM) i7-7820HQ CPU @ 2.90GHz\n  WORD_SIZE: 64\n  LIBM: libopenlibm\n  LLVM: libLLVM-12.0.1 (ORCJIT, skylake)","category":"page"},{"location":"#Type-Pgen","page":"PGENFiles.jl Tutorial","title":"Type Pgen","text":"","category":"section"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"The type Pgen is the fundamental type for .pgen-formatted files. It can be created using the following line.","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"using PGENFiles\np = Pgen(PGENFiles.datadir(\"bgen_example.16bits.pgen\")) ;","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"This example file is a PGEN file converted from a BGEN file.","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"Number of variants and samples in the file is accessible with the functions n_variants() and n_samples(). ","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"println(n_variants(p))","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"199","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"println(n_samples(p))","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"500","category":"page"},{"location":"#VariantIterator","page":"PGENFiles.jl Tutorial","title":"VariantIterator","text":"","category":"section"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"Genotype information of each variant is compressed separately in PGEN files. The offsets (starting points in pgen file) of each variant can be inferred from the header. A way to iterate over variants in a PGEN file is provided through a VariantIterator object, created by the function iterator(). ","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"v_iter = iterator(p);","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"One may check index, offset (starting point of each variant record), record type (how each variant record is comprssed and what type of information it has), and length of each variant using the following code:","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"for v in v_iter\n    println(\"Variant $(v.index): offset $(v.offset), type 0x$(string(v.record_type, base=16)),\" * \n        \" length $(v.length)\")\nend","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"Variant 1: offset 617, type 0x60, length 1186\nVariant 2: offset 1803, type 0x60, length 1182\nVariant 3: offset 2985, type 0x41, length 1098\nVariant 4: offset 4083, type 0x60, length 1182\nVariant 5: offset 5265, type 0x60, length 1184\nVariant 6: offset 6449, type 0x60, length 1186\nVariant 7: offset 7635, type 0x44, length 1057\nVariant 8: offset 8692, type 0x61, length 1146\nVariant 9: offset 9838, type 0x61, length 1120\nVariant 10: offset 10958, type 0x60, length 1184\nVariant 11: offset 12142, type 0x61, length 1144\nVariant 12: offset 13286, type 0x40, length 1125\nVariant 13: offset 14411, type 0x41, length 1078\nVariant 14: offset 15489, type 0x40, length 1125\nVariant 15: offset 16614, type 0x41, length 1079\nVariant 16: offset 17693, type 0x66, length 1115\nVariant 17: offset 18808, type 0x60, length 1186\nVariant 18: offset 19994, type 0x44, length 1056\nVariant 19: offset 21050, type 0x60, length 1186\nVariant 20: offset 22236, type 0x46, length 1060\nVariant 21: offset 23296, type 0x61, length 1145\nVariant 22: offset 24441, type 0x61, length 1147\nVariant 23: offset 25588, type 0x44, length 1034\nVariant 24: offset 26622, type 0x41, length 1072\nVariant 25: offset 27694, type 0x41, length 1084\nVariant 26: offset 28778, type 0x40, length 1125\nVariant 27: offset 29903, type 0x61, length 1162\nVariant 28: offset 31065, type 0x44, length 1011\nVariant 29: offset 32076, type 0x41, length 1083\nVariant 30: offset 33159, type 0x40, length 1125\nVariant 31: offset 34284, type 0x61, length 1129\nVariant 32: offset 35413, type 0x44, length 1055\nVariant 33: offset 36468, type 0x61, length 1118\nVariant 34: offset 37586, type 0x60, length 1184\nVariant 35: offset 38770, type 0x40, length 1125\nVariant 36: offset 39895, type 0x60, length 1184\nVariant 37: offset 41079, type 0x61, length 1154\nVariant 38: offset 42233, type 0x40, length 1125\nVariant 39: offset 43358, type 0x60, length 1184\nVariant 40: offset 44542, type 0x41, length 1079\nVariant 41: offset 45621, type 0x41, length 1076\nVariant 42: offset 46697, type 0x61, length 1142\nVariant 43: offset 47839, type 0x60, length 1186\nVariant 44: offset 49025, type 0x61, length 1155\nVariant 45: offset 50180, type 0x41, length 1078\nVariant 46: offset 51258, type 0x40, length 1125\nVariant 47: offset 52383, type 0x41, length 1068\nVariant 48: offset 53451, type 0x41, length 1077\nVariant 49: offset 54528, type 0x40, length 1125\nVariant 50: offset 55653, type 0x60, length 1186\nVariant 51: offset 56839, type 0x40, length 1125\nVariant 52: offset 57964, type 0x41, length 1079\nVariant 53: offset 59043, type 0x41, length 1099\nVariant 54: offset 60142, type 0x60, length 1186\nVariant 55: offset 61328, type 0x40, length 1125\nVariant 56: offset 62453, type 0x40, length 1125\nVariant 57: offset 63578, type 0x40, length 1125\nVariant 58: offset 64703, type 0x40, length 1125\nVariant 59: offset 65828, type 0x40, length 1125\nVariant 60: offset 66953, type 0x61, length 1126\nVariant 61: offset 68079, type 0x60, length 1186\nVariant 62: offset 69265, type 0x40, length 1125\nVariant 63: offset 70390, type 0x44, length 1029\nVariant 64: offset 71419, type 0x40, length 1125\nVariant 65: offset 72544, type 0x60, length 1186\nVariant 66: offset 73730, type 0x60, length 1186\nVariant 67: offset 74916, type 0x40, length 1125\nVariant 68: offset 76041, type 0x41, length 1101\nVariant 69: offset 77142, type 0x61, length 1146\nVariant 70: offset 78288, type 0x60, length 1180\nVariant 71: offset 79468, type 0x41, length 1072\nVariant 72: offset 80540, type 0x44, length 1016\nVariant 73: offset 81556, type 0x60, length 1186\nVariant 74: offset 82742, type 0x44, length 1045\nVariant 75: offset 83787, type 0x40, length 1125\nVariant 76: offset 84912, type 0x40, length 1125\nVariant 77: offset 86037, type 0x41, length 1070\nVariant 78: offset 87107, type 0x60, length 1186\nVariant 79: offset 88293, type 0x61, length 1142\nVariant 80: offset 89435, type 0x44, length 1072\nVariant 81: offset 90507, type 0x41, length 1071\nVariant 82: offset 91578, type 0x60, length 1186\nVariant 83: offset 92764, type 0x41, length 1086\nVariant 84: offset 93850, type 0x40, length 1125\nVariant 85: offset 94975, type 0x61, length 1147\nVariant 86: offset 96122, type 0x41, length 1088\nVariant 87: offset 97210, type 0x60, length 1186\nVariant 88: offset 98396, type 0x40, length 1125\nVariant 89: offset 99521, type 0x44, length 1062\nVariant 90: offset 100583, type 0x40, length 1125\nVariant 91: offset 101708, type 0x41, length 1080\nVariant 92: offset 102788, type 0x46, length 1022\nVariant 93: offset 103810, type 0x40, length 1125\nVariant 94: offset 104935, type 0x60, length 1182\nVariant 95: offset 106117, type 0x40, length 1125\nVariant 96: offset 107242, type 0x40, length 1125\nVariant 97: offset 108367, type 0x61, length 1150\nVariant 98: offset 109517, type 0x41, length 1071\nVariant 99: offset 110588, type 0x60, length 1186\nVariant 100: offset 111774, type 0x60, length 1186\nVariant 101: offset 112960, type 0x40, length 1125\nVariant 102: offset 114085, type 0x40, length 1125\nVariant 103: offset 115210, type 0x61, length 1159\nVariant 104: offset 116369, type 0x60, length 1182\nVariant 105: offset 117551, type 0x60, length 1182\nVariant 106: offset 118733, type 0x60, length 1186\nVariant 107: offset 119919, type 0x46, length 1057\nVariant 108: offset 120976, type 0x41, length 1085\nVariant 109: offset 122061, type 0x61, length 1118\nVariant 110: offset 123179, type 0x60, length 1186\nVariant 111: offset 124365, type 0x61, length 1146\nVariant 112: offset 125511, type 0x40, length 1125\nVariant 113: offset 126636, type 0x41, length 1078\nVariant 114: offset 127714, type 0x40, length 1125\nVariant 115: offset 128839, type 0x41, length 1079\nVariant 116: offset 129918, type 0x44, length 1054\nVariant 117: offset 130972, type 0x60, length 1182\nVariant 118: offset 132154, type 0x46, length 1056\nVariant 119: offset 133210, type 0x60, length 1186\nVariant 120: offset 134396, type 0x44, length 1060\nVariant 121: offset 135456, type 0x61, length 1147\nVariant 122: offset 136603, type 0x61, length 1147\nVariant 123: offset 137750, type 0x46, length 1034\nVariant 124: offset 138784, type 0x41, length 1072\nVariant 125: offset 139856, type 0x41, length 1084\nVariant 126: offset 140940, type 0x40, length 1125\nVariant 127: offset 142065, type 0x61, length 1160\nVariant 128: offset 143225, type 0x46, length 1011\nVariant 129: offset 144236, type 0x41, length 1083\nVariant 130: offset 145319, type 0x60, length 1186\nVariant 131: offset 146505, type 0x41, length 1068\nVariant 132: offset 147573, type 0x46, length 1055\nVariant 133: offset 148628, type 0x61, length 1122\nVariant 134: offset 149750, type 0x60, length 1182\nVariant 135: offset 150932, type 0x40, length 1125\nVariant 136: offset 152057, type 0x60, length 1186\nVariant 137: offset 153243, type 0x61, length 1152\nVariant 138: offset 154395, type 0x40, length 1125\nVariant 139: offset 155520, type 0x60, length 1184\nVariant 140: offset 156704, type 0x61, length 1140\nVariant 141: offset 157844, type 0x41, length 1076\nVariant 142: offset 158920, type 0x61, length 1142\nVariant 143: offset 160062, type 0x60, length 1186\nVariant 144: offset 161248, type 0x61, length 1153\nVariant 145: offset 162401, type 0x41, length 1078\nVariant 146: offset 163479, type 0x40, length 1125\nVariant 147: offset 164604, type 0x41, length 1068\nVariant 148: offset 165672, type 0x41, length 1077\nVariant 149: offset 166749, type 0x40, length 1125\nVariant 150: offset 167874, type 0x60, length 1186\nVariant 151: offset 169060, type 0x40, length 1125\nVariant 152: offset 170185, type 0x41, length 1079\nVariant 153: offset 171264, type 0x61, length 1160\nVariant 154: offset 172424, type 0x60, length 1186\nVariant 155: offset 173610, type 0x40, length 1125\nVariant 156: offset 174735, type 0x40, length 1125\nVariant 157: offset 175860, type 0x40, length 1125\nVariant 158: offset 176985, type 0x40, length 1125\nVariant 159: offset 178110, type 0x60, length 1186\nVariant 160: offset 179296, type 0x61, length 1124\nVariant 161: offset 180420, type 0x60, length 1186\nVariant 162: offset 181606, type 0x40, length 1125\nVariant 163: offset 182731, type 0x46, length 1029\nVariant 164: offset 183760, type 0x40, length 1125\nVariant 165: offset 184885, type 0x40, length 1125\nVariant 166: offset 186010, type 0x60, length 1186\nVariant 167: offset 187196, type 0x60, length 1186\nVariant 168: offset 188382, type 0x41, length 1101\nVariant 169: offset 189483, type 0x61, length 1146\nVariant 170: offset 190629, type 0x60, length 1184\nVariant 171: offset 191813, type 0x41, length 1072\nVariant 172: offset 192885, type 0x46, length 1016\nVariant 173: offset 193901, type 0x60, length 1184\nVariant 174: offset 195085, type 0x46, length 1045\nVariant 175: offset 196130, type 0x60, length 1186\nVariant 176: offset 197316, type 0x40, length 1125\nVariant 177: offset 198441, type 0x41, length 1070\nVariant 178: offset 199511, type 0x60, length 1184\nVariant 179: offset 200695, type 0x61, length 1142\nVariant 180: offset 201837, type 0x46, length 1072\nVariant 181: offset 202909, type 0x61, length 1132\nVariant 182: offset 204041, type 0x60, length 1186\nVariant 183: offset 205227, type 0x41, length 1086\nVariant 184: offset 206313, type 0x40, length 1125\nVariant 185: offset 207438, type 0x41, length 1088\nVariant 186: offset 208526, type 0x41, length 1088\nVariant 187: offset 209614, type 0x60, length 1184\nVariant 188: offset 210798, type 0x40, length 1125\nVariant 189: offset 211923, type 0x46, length 1062\nVariant 190: offset 212985, type 0x60, length 1186\nVariant 191: offset 214171, type 0x41, length 1080\nVariant 192: offset 215251, type 0x44, length 1022\nVariant 193: offset 216273, type 0x40, length 1125\nVariant 194: offset 217398, type 0x60, length 1186\nVariant 195: offset 218584, type 0x40, length 1125\nVariant 196: offset 219709, type 0x40, length 1125\nVariant 197: offset 220834, type 0x61, length 1152\nVariant 198: offset 221986, type 0x41, length 1071\nVariant 199: offset 223057, type 0x60, length 1184","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"More information on each variant is available in the attached .pvar file. ","category":"page"},{"location":"#Genotypes-and-dosages","page":"PGENFiles.jl Tutorial","title":"Genotypes and dosages","text":"","category":"section"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"Genotypes of each variant is available through the function get_genotypes() or get_genotypes!(). For example, to obtain the genotypes of the first variant, one may do:","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"v = first(v_iter)\ng, data, offset = get_genotypes(p, v)","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"(UInt8[0x03, 0x00, 0x00, 0x01, 0x00, 0x03, 0x01, 0x00, 0x03, 0x03  …  0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x01, 0x00, 0x03, 0x01], UInt8[0x43, 0x1c, 0xff, 0x14, 0xc7, 0x0f, 0x00, 0x30, 0x01, 0x04  …  0xdc, 0x03, 0xd3, 0x42, 0x9e, 0x03, 0x07, 0x79, 0x4b, 0x3f], 0x000000000000007d)","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"g stores the genotypes, data is the variant record for v, and offset indicates where the track for genotypes ended. Encoding for g is as following:","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"genotype code genotype category\n0x00 homozygous REF\n0x01 heterozygous REF-ALT\n0x02 homozygous ALT\n0x03 missing","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"To avoid array allocations for iterative genotype extraction, one may preallocate g and reuse it. As some of the variants are LD-compressed, an additional genotype buffer to keep the genotypes for the most recent non-LD-compressed variant may be desirable (g_ld). If g_ld is not provided, it will parse the genotypes of the most recent non-LD-compressed variant (stored in an internal dictionary) first.","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"For example:","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"g = Vector{UInt8}(undef, n_samples(p))\ng_ld = similar(g)\nfor v in v_iter\n    get_genotypes!(g, p, v; ldbuf=g_ld)\n    v_rt = v.record_type & 0x07\n    if v_rt != 0x02 && v_rt != 0x03 # non-LD-compressed. See Format description.\n        g_ld .= g\n    end\n    \n    # do someting with genotypes in `g`...\nend","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"Similarly, ALT allele dosages are available through the function alt_allele_dosage() and alt_allele_dosage!(). As genotype information is required to retrieve dosages, space for genotypes are also required for alt_allele_dosage!(). These functions return dosages, parsed genotypes, and endpoint of the dosage information in the current variant record.","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"To obtain the dosages of the first variant: ","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"v = first(v_iter)\nd, g, offset = alt_allele_dosage(p, v)","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"(Float32[NaN, 0.06427002, 0.08441162, 0.98254395, 0.08843994, 0.14111328, 1.0733032, 0.054138184, 0.10858154, 0.12310791  …  0.029785156, 0.9661255, 0.00079345703, 1.0126343, 0.042663574, 0.060302734, 1.0441284, 0.056518555, 1.8910522, 0.98895264], UInt8[0x03, 0x00, 0x00, 0x01, 0x00, 0x03, 0x01, 0x00, 0x03, 0x03  …  0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x01, 0x00, 0x03, 0x01], 0x00000000000004a2)","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"Missing value is represented by a NaN. Code for a typical GWAS application should look like:","category":"page"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"d = Vector{Float32}(undef, n_samples(p))\ng = Vector{UInt8}(undef, n_samples(p))\ng_ld = similar(g)\nfor v in v_iter\n    alt_allele_dosage!(d, g, p, v; genoldbuf=g_ld)\n    v_rt = v.record_type & 0x07\n    if v_rt != 0x02 && v_rt != 0x03 # non-LD-compressed. See Format description.\n        g_ld .= g\n    end\n    \n    # do someting with dosage values in `d`...\nend","category":"page"},{"location":"#Speed","page":"PGENFiles.jl Tutorial","title":"Speed","text":"","category":"section"},{"location":"","page":"PGENFiles.jl Tutorial","title":"PGENFiles.jl Tutorial","text":"The current PGEN package can read in ~2000 variants / second for UK Biobank data, which is about 4x faster than reading in BGEN-formatted data. ","category":"page"}]
}
