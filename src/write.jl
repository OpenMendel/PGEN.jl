"""
    write_PGEN(pgen_filename, x, sampleID, variantID)

Saves numeric matrix `x` into a PGEN formatted file. We assume `x`
stores dosage diploid genotype (i.e. `x[i, j] ∈ [0, 2]`). Note all hard-call
genotype values in the resulting PGEN file are all stored as missing. 

# Inputs
+ `pgen_filename`: Output filename of PGEN file (do not include `.pgen/.pvar/.psam`)
+ `x`: Numeric matrix, each row is a sample and each column is a SNP. `x[i, j]`
    is considered missing if `ismissing(x[i,j]) == true` or `isnan(x[i,j]) == true`.
+ `FID`: Vector storing each sample's family ID, defaults to 0
+ `IID`: Vector storing each sample's individual ID, defaults to integer between 1-n
+ `PAT`: Vector storing each sample's father ID, defaults to 0
+ `MAT`: Vector storing each sample's mother ID, defaults to 0
+ `SEX`: Vector storing each sample's sex, defaults to "NA"
+ `CHROM`: Vector storing each variant's chromosome number, defaults to 1
+ `ID`: Vector storing each variant's ID, detaults to snp1, snp2,... etc
+ `POS`: Vector storing each variant's position, defaults to 1, 2, ...
+ `ALT`: Vector storing each variant's alternate alleles, defaults to A
+ `REF`: Vector storing each variant's reference allele, defaults to T

# PGEN format structure
----Header-----
1. Magic number, storage mode, data dimension
2. 12th byte: structure of variant record types/length, allele counts, provision ref
3. Variant block offsets (starting positions of each variant record)
4. A bunch of blocks, each block storing 2^16 variant record types followed by 2^16 
    variant record length
----Variant records-----
5. Variant record #0 starts here
"""
function write_PGEN(
    pgen_filename::AbstractString, 
    x::AbstractMatrix;
    # psam values
    FID::AbstractVector = zeros(Int, size(x, 1)),
    IID::AbstractVector = collect(1:size(x, 1)),
    PAT::AbstractVector = zeros(Int, size(x, 1)),
    MAT::AbstractVector = zeros(Int, size(x, 1)),
    SEX::AbstractVector = ["NA" for i in 1:size(x, 1)],
    # pvar values
    CHROM::AbstractVector = ones(Int, size(x, 2)),
    ID::AbstractVector = ["snp$i" for i in 1:size(x, 2)],
    POS::AbstractVector = collect(1:size(x, 2)),
    ALT::AbstractVector = ["A" for i in 1:size(x, 2)],
    REF::AbstractVector = ["T" for i in 1:size(x, 2)],
    )
    n_samples, n_variants = size(x)
    n_blocks = PGENFiles.ceil_int(n_variants, 2^16) #Int(ceil(n_variants / 2 ^ 16))
    bytes_written = 0
    pb = PipeBuffer()
    # main PGEN file
    open(pgen_filename * ".pgen", "w") do io
        #
        # Construct header
        #
        # magic number
        bytes_written += write(pb, 0x6c, 0x1b)
        # storage mode
        bytes_written += write(pb, 0x10) # 2 bytes so far (note: 0-based indexing according to manual) 
        # data dimension
        bytes_written += write(pb, UInt32(n_variants)) # 6 bytes
        bytes_written += write(pb, UInt32(n_samples)) # 10 bytes
        # 11th byte indicating how data is stored
        bits_per_record_type = 8 # need 8 to encode dosages
        bytes_per_record_length = 2 # each variant stored as UInt16 (i.e. requiring 2 bytes)
        twelfth_byte_bits =  "10" * "00" * "0101" # all ref alleles provisional; no allele counts; 8 bits per record type, 2 bytes per record length; 
        bytes_written += write(pb, bitstring2byte(twelfth_byte_bits))
        # some constants for computing variant block offsets (i.e. start position for each block)
        variant_offset = 12 + 8n_blocks
        variant_type_offset = Int(2^16 / (8 / bits_per_record_type))
        variant_length_offset = 2^16 * bytes_per_record_length
        variant_offset += (n_blocks - 1) * (variant_type_offset + variant_length_offset)
        last_block_variants = n_variants % 2^16
        variant_offset += Int(last_block_variants / (8 / bits_per_record_type)) + 
            last_block_variants * bytes_per_record_length # 99325313 if bits_per_record_type = 4; bytes_per_record_length = 2; n_samples = 1092; n_variants = 39728178
        # store variant offsets for each block, assuming each variant record has fixed width
        bytes_per_variant = (bytes_per_record_length * n_samples + ceil(Int, 0.25n_samples))
        bytes_per_variant_record = 2^16 * bytes_per_variant
        for b in 1:n_blocks
            block_offset = variant_offset + (b - 1) * bytes_per_variant_record
            for x in int2bytes(block_offset, len=8)
                bytes_written += write(pb, x)
            end
        end
        # store variant record types and variant record lengths for each block.
        # Here record type is:
        #   "0" (explicit phased-dosages abscent) + 
        #   "10" (dosage exists for all samples, value of 65535 represents missing) +
        #   "0" (no phased hetero hard calls) +
        #   "0" (no multi allelic hard calls) +
        #   "000" (no compression)
        variant_record_type = bitstring2byte("01000000") # 0x40
        variant_record_byte_length = int2bytes(bytes_per_variant, len=2)
        for b in 1:(n_blocks - 1)
            for snp in 1:2^16
                bytes_written += write(pb, variant_record_type)
            end
            for snp in 1:2^16
                bytes_written += write(pb, variant_record_byte_length)
            end
            bytesavailable(pb) > 1048576 && write(io, take!(pb))
        end
        # last block 
        remainders = n_variants % 2^16
        for snp in 1:remainders
            bytes_written += write(pb, variant_record_type)
        end
        for snp in 1:remainders
            bytes_written += write(pb, variant_record_byte_length)
        end
        write(io, take!(pb))
        #
        # Construct variant records 
        #
        for j in 1:n_variants
            bytes_written += write_variant_record(pb, @view(x[:, j]))
            bytesavailable(pb) > 1048576 && write(io, take!(pb))
        end
        write(io, take!(pb))
    end
    # handle psam file
    open(pgen_filename * ".psam", "w") do io
        println(io, "#FID\tIID\tPAT\tMAT\tSEX")
        for i in 1:n_samples
            println(io, FID[i], '\t', IID[i], '\t', PAT[i], '\t', MAT[i], '\t', SEX[i])
        end
    end
    # handle pvar file (consider output a zs-compressed pvar file by default)
    open(pgen_filename * ".pvar", "w") do io
        println(io, "#CHROM\tID\tPOS\tALT\tREF")
        for i in 1:n_variants
            println(io, CHROM[i], '\t', ID[i], '\t', POS[i], '\t', ALT[i], '\t', REF[i])
        end
    end
    return bytes_written
end

function write_variant_record(io, xj::AbstractVector, storage=zeros(Int, 1)) # xj is the jth column of x
    N = length(xj)
    bytes_written = 0
    # main data track (currently assumes all hard-call genotypes are missing)
    for xij in 1:div(N, 4)
        bytes_written += write(io, 0xff) # 11 11 11 11
    end
    leftover = N % 4
    if leftover > 0
        bytes_written += write(io, bitstring2byte("0"^(8 - 2leftover) * "1"^2leftover))
    end
    # track #4
    for xij in xj
        bytes_written += write(io, dosage_to_uint16(xij, 2, storage))
    end
    return bytes_written
end

function dosage_to_uint16(xij::AbstractFloat, ploidy::Int=2, storage=zeros(Int, 1))
    if isnan(xij)
        return int2bytes(65535, len=2, storage=storage)
    else
        return int2bytes(round(Int, xij/ploidy * 2^15), len=2, storage=storage)
    end
end
function dosage_to_uint16(::Missing, ploidy, storage)
    return int2bytes(65535, len=2, storage=storage)
end

"""
int2bytes(x::Integer; len::Integer, little_endian::Bool)
    -> Vector{len, UInt8}

Convert an Integer `x` to a Vector{UInt8}
Options (not available for `x::BigInt`):
- `len` to define a minimum Vector lenght in bytes, result will show no leading
zero by default.
- set `little_endian` to `true` for a result in little endian byte order.
    julia> int2bytes(32974)
    2-element Array{UInt8,1}:
     0x80
     0xce
    julia> int2bytes(32974, len=4)
    4-element Array{UInt8,1}:
     0x00
     0x00
     0x80
     0xce
    julia> int2bytes(32974, little_endian=true)
    2-element Array{UInt8,1}:
     0xce
     0x80

# Source
https://github.com/roshii/BitConverter.jl/blob/master/src/BitConverter.jl
"""
function int2bytes(x::Integer; len::Integer=0, little_endian::Bool=true, storage=zeros(Int, 1))
    storage[1] = hton(x)
    result = reinterpret(UInt8, storage)
    i = findfirst(x -> x != 0x00, result)
    if len != 0
        i = length(result) - len + 1
    end
    result = @view(result[i:end])
    if little_endian
        reverse!(result)
    end
    return result
end

"""
    bitstring2byte(s)

Parse a 8-digit bitstring (stored in Big endian) to an UInt8.

# Examples
+ bitstring2byte("00000001") = 0x01
+ bitstring2byte("01110001") = 0x71
"""
function bitstring2byte(s::AbstractString)
    @assert length(s) == 8
    return parse(UInt8, s, base=2)
end
